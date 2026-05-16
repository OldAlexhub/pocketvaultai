import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {DEFAULT_REMINDER_DAYS, SENSITIVE_DEFAULT_TYPES} from '../constants';
import {
  BackupFile,
  CarryMode,
  UsageEvent,
  UserSettings,
  VaultData,
  VaultItem,
  VaultItemType,
} from '../types';
import {nowISO} from '../utils/date';
import {createId} from '../utils/ids';
import {validateVaultItem} from '../utils/validation';
import {buildReminderPlan, rescheduleAllReminders} from '../services/notificationService';
import {clearStoredVaultData, createEmptyVaultData, loadVaultData, normalizeVaultData, saveVaultData} from '../services/storageService';

type VaultContextValue = {
  data: VaultData;
  loading: boolean;
  error?: string;
  saveItem: (input: Partial<VaultItem>) => Promise<VaultItem>;
  deleteItem: (id: string) => Promise<void>;
  archiveItem: (id: string, archived: boolean) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markItemUsed: (id: string) => Promise<void>;
  saveCarryMode: (input: Partial<CarryMode>) => Promise<CarryMode>;
  deleteCarryMode: (id: string) => Promise<void>;
  duplicateCarryMode: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  addUsageEvent: (event: Omit<UsageEvent, 'id' | 'timestamp'>) => Promise<void>;
  importBackup: (backup: BackupFile, mode: 'replace' | 'merge') => Promise<void>;
  clearAllData: () => Promise<void>;
  refresh: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

function applyReminders(data: VaultData): VaultData {
  return {...data, reminders: buildReminderPlan(data)};
}

export function VaultProvider({children}: {children: React.ReactNode}) {
  const [data, setData] = useState<VaultData>(createEmptyVaultData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const persist = useCallback(async (nextData: VaultData) => {
    const normalized = applyReminders(normalizeVaultData(nextData));
    setData(normalized);
    await saveVaultData(normalized);
    rescheduleAllReminders(normalized).catch(err => {
      if (__DEV__) {
        console.warn('Reminder reschedule failed', err);
      }
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const loaded = applyReminders(await loadVaultData());
      setData(loaded);
      await saveVaultData(loaded);
    } catch {
      setError('Your local vault could not be loaded. You can retry or reset local data in Settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveItem = useCallback(
    async (input: Partial<VaultItem>) => {
      const ts = nowISO();
      const id = input.id ?? createId('item');
      const existing = data.items.find(item => item.id === id);
      const type = (input.type ?? existing?.type ?? 'custom') as VaultItemType;
      const next: VaultItem = {
        id,
        title: input.title?.trim() ?? existing?.title ?? '',
        type,
        categoryLabel: input.categoryLabel?.trim() || existing?.categoryLabel || 'Custom',
        ownerName: input.ownerName?.trim() || undefined,
        linkedVehicleId: input.linkedVehicleId || undefined,
        issuer: input.issuer?.trim() || undefined,
        memberNumber: input.memberNumber?.trim() || undefined,
        documentNumberMasked: input.documentNumberMasked?.trim() || undefined,
        documentNumberSensitive: input.documentNumberSensitive?.trim() || undefined,
        frontImageUri: input.frontImageUri || existing?.frontImageUri,
        backImageUri: input.backImageUri || existing?.backImageUri,
        issueDate: input.issueDate || undefined,
        expirationDate: input.expirationDate || undefined,
        renewalDate: input.renewalDate || undefined,
        reminderDaysBefore: input.reminderDaysBefore?.length ? input.reminderDaysBefore : existing?.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS,
        notes: input.notes?.trim() || undefined,
        tags: input.tags ?? existing?.tags ?? [],
        colorLabel: input.colorLabel || existing?.colorLabel,
        favorite: input.favorite ?? existing?.favorite ?? false,
        sensitive: input.sensitive ?? existing?.sensitive ?? SENSITIVE_DEFAULT_TYPES.includes(type),
        archived: input.archived ?? existing?.archived ?? false,
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
        lastViewedAt: existing?.lastViewedAt,
        lastUsedAt: existing?.lastUsedAt,
      };
      const validation = validateVaultItem(next);
      if (!validation.valid) {
        throw new Error(Object.values(validation.errors)[0] || 'Item validation failed.');
      }
      const items = existing ? data.items.map(item => (item.id === id ? next : item)) : [next, ...data.items];
      await persist({...data, items});
      return next;
    },
    [data, persist],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await persist({
        ...data,
        items: data.items.filter(item => item.id !== id),
        usageEvents: data.usageEvents.filter(event => event.itemId !== id),
      });
    },
    [data, persist],
  );

  const archiveItem = useCallback(
    async (id: string, archived: boolean) => {
      await persist({
        ...data,
        items: data.items.map(item => (item.id === id ? {...item, archived, updatedAt: nowISO()} : item)),
      });
    },
    [data, persist],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      await persist({
        ...data,
        items: data.items.map(item => (item.id === id ? {...item, favorite: !item.favorite, updatedAt: nowISO()} : item)),
      });
    },
    [data, persist],
  );

  const addUsageEvent = useCallback(
    async (event: Omit<UsageEvent, 'id' | 'timestamp'>) => {
      const nextEvent: UsageEvent = {...event, id: createId('event'), timestamp: nowISO()};
      await persist({...data, usageEvents: [nextEvent, ...data.usageEvents].slice(0, 500)});
    },
    [data, persist],
  );

  const markItemUsed = useCallback(
    async (id: string) => {
      const ts = nowISO();
      const event: UsageEvent = {id: createId('event'), itemId: id, eventType: 'used', timestamp: ts};
      await persist({
        ...data,
        items: data.items.map(item => (item.id === id ? {...item, lastUsedAt: ts, lastViewedAt: ts, updatedAt: ts} : item)),
        usageEvents: [event, ...data.usageEvents].slice(0, 500),
      });
    },
    [data, persist],
  );

  const saveCarryMode = useCallback(
    async (input: Partial<CarryMode>) => {
      const ts = nowISO();
      const id = input.id ?? createId('mode');
      const existing = data.carryModes.find(mode => mode.id === id);
      const mode: CarryMode = {
        id,
        name: input.name?.trim() ?? existing?.name ?? 'Custom',
        description: input.description?.trim() ?? existing?.description ?? '',
        icon: input.icon?.trim().slice(0, 2).toUpperCase() || existing?.icon || 'CM',
        requiredItemTypes: input.requiredItemTypes ?? existing?.requiredItemTypes ?? [],
        requiredItemIds: input.requiredItemIds ?? existing?.requiredItemIds ?? [],
        reminderEnabled: input.reminderEnabled ?? existing?.reminderEnabled ?? false,
        reminderTime: input.reminderTime ?? existing?.reminderTime ?? '08:00',
        activeDays: input.activeDays ?? existing?.activeDays ?? [1, 2, 3, 4, 5],
        createdAt: existing?.createdAt ?? ts,
        updatedAt: ts,
      };
      const carryModes = existing
        ? data.carryModes.map(current => (current.id === id ? mode : current))
        : [mode, ...data.carryModes];
      await persist({...data, carryModes});
      return mode;
    },
    [data, persist],
  );

  const deleteCarryMode = useCallback(
    async (id: string) => {
      await persist({
        ...data,
        carryModes: data.carryModes.filter(mode => mode.id !== id),
        usageEvents: data.usageEvents.filter(event => event.carryModeId !== id),
      });
    },
    [data, persist],
  );

  const duplicateCarryMode = useCallback(
    async (id: string) => {
      const source = data.carryModes.find(mode => mode.id === id);
      if (!source) {
        return;
      }
      await saveCarryMode({...source, id: undefined, name: `${source.name} copy`, createdAt: undefined, updatedAt: undefined});
    },
    [data.carryModes, saveCarryMode],
  );

  const updateSettings = useCallback(
    async (settings: Partial<UserSettings>) => {
      await persist({...data, settings: {...data.settings, ...settings, updatedAt: nowISO()}});
    },
    [data, persist],
  );

  const importBackup = useCallback(
    async (backup: BackupFile, mode: 'replace' | 'merge') => {
      const imported = normalizeVaultData({
        appVersion: backup.appVersion,
        items: backup.items,
        vehicleProfiles: backup.vehicleProfiles,
        carryModes: backup.carryModes,
        reminders: backup.reminders,
        usageEvents: backup.usageEvents ?? [],
        settings: {...data.settings, backupWarningAccepted: data.settings.backupWarningAccepted},
      });
      if (mode === 'replace') {
        await persist(imported);
        return;
      }
      const idMap = new Map<string, string>();
      const items = imported.items.map(item => {
        const newId = data.items.some(existing => existing.id === item.id) ? createId('item') : item.id;
        idMap.set(item.id, newId);
        return {...item, id: newId, createdAt: item.createdAt || nowISO(), updatedAt: nowISO()};
      });
      const carryModes = imported.carryModes.map(modeItem => {
        const newId = data.carryModes.some(existing => existing.id === modeItem.id) ? createId('mode') : modeItem.id;
        return {
          ...modeItem,
          id: newId,
          requiredItemIds: modeItem.requiredItemIds.map(itemId => idMap.get(itemId) ?? itemId),
          updatedAt: nowISO(),
        };
      });
      await persist({
        ...data,
        items: [...items, ...data.items],
        vehicleProfiles: [...imported.vehicleProfiles, ...data.vehicleProfiles],
        carryModes: [...carryModes, ...data.carryModes],
        usageEvents: [...imported.usageEvents, ...data.usageEvents].slice(0, 500),
      });
    },
    [data, persist],
  );

  const clearAllData = useCallback(async () => {
    await clearStoredVaultData();
    const empty = createEmptyVaultData();
    setData(empty);
    await saveVaultData(empty);
  }, []);

  const value = useMemo<VaultContextValue>(
    () => ({
      data,
      loading,
      error,
      saveItem,
      deleteItem,
      archiveItem,
      toggleFavorite,
      markItemUsed,
      saveCarryMode,
      deleteCarryMode,
      duplicateCarryMode,
      updateSettings,
      addUsageEvent,
      importBackup,
      clearAllData,
      refresh,
    }),
    [
      data,
      loading,
      error,
      saveItem,
      deleteItem,
      archiveItem,
      toggleFavorite,
      markItemUsed,
      saveCarryMode,
      deleteCarryMode,
      duplicateCarryMode,
      updateSettings,
      addUsageEvent,
      importBackup,
      clearAllData,
      refresh,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used inside VaultProvider.');
  }
  return context;
}
