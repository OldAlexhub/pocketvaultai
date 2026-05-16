import {APP_VERSION, createDefaultCarryModes, createDefaultSettings} from '../constants';
import {VaultData} from '../types';
import {PocketVaultStorageModule} from './nativeModules';

let memoryFallback: VaultData | null = null;

export function createEmptyVaultData(): VaultData {
  return {
    appVersion: APP_VERSION,
    items: [],
    vehicleProfiles: [],
    carryModes: createDefaultCarryModes(),
    reminders: [],
    usageEvents: [],
    settings: createDefaultSettings(),
  };
}

export function normalizeVaultData(input: Partial<VaultData> | null | undefined): VaultData {
  const empty = createEmptyVaultData();
  const settings = {...empty.settings, ...(input?.settings ?? {})};
  const carryModes = input?.carryModes?.length ? input.carryModes : empty.carryModes;
  return {
    appVersion: input?.appVersion || APP_VERSION,
    items: Array.isArray(input?.items) ? input!.items : [],
    vehicleProfiles: Array.isArray(input?.vehicleProfiles) ? input!.vehicleProfiles : [],
    carryModes,
    reminders: Array.isArray(input?.reminders) ? input!.reminders : [],
    usageEvents: Array.isArray(input?.usageEvents) ? input!.usageEvents : [],
    settings,
  };
}

export async function loadVaultData(): Promise<VaultData> {
  if (!PocketVaultStorageModule) {
    return memoryFallback ?? createEmptyVaultData();
  }
  try {
    const raw = await PocketVaultStorageModule.getVaultData();
    if (!raw) {
      return createEmptyVaultData();
    }
    return normalizeVaultData(JSON.parse(raw));
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to load vault data', error);
    }
    return createEmptyVaultData();
  }
}

export async function saveVaultData(data: VaultData): Promise<void> {
  const normalized = normalizeVaultData(data);
  memoryFallback = normalized;
  if (!PocketVaultStorageModule) {
    return;
  }
  await PocketVaultStorageModule.saveVaultData(JSON.stringify(normalized));
}

export async function clearStoredVaultData(): Promise<void> {
  memoryFallback = createEmptyVaultData();
  if (PocketVaultStorageModule) {
    await PocketVaultStorageModule.clearVaultData();
  }
}
