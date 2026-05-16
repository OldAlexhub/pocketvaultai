import {PermissionsAndroid, Platform} from 'react-native';
import {CarryMode, Reminder, VaultData, VaultItem} from '../types';
import {dateTimeFromDateAndTime, addDays, nowISO, todayISO} from '../utils/date';
import {createId} from '../utils/ids';
import {PocketVaultNotificationModule} from './nativeModules';

export async function canPostNotifications(): Promise<boolean> {
  if (!PocketVaultNotificationModule) {
    return false;
  }
  return PocketVaultNotificationModule.canPostNotifications();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (Platform.Version < 33) {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
    title: 'Reminder notifications',
    message: 'PocketVault AI uses notifications only for local renewal and carry check reminders.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function reminderForItem(item: VaultItem, type: 'expiration' | 'renewal', scheduledDateTime: string): Reminder {
  const label = type === 'expiration' ? 'Expiration reminder' : 'Renewal reminder';
  return {
    id: `${type}-${item.id}-${scheduledDateTime.slice(0, 10)}`,
    itemId: item.id,
    type,
    title: `${label}: ${item.title}`,
    message: `${item.title} has a reference date coming up. Review your official document if needed.`,
    scheduledDateTime,
    enabled: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

function nextActiveDateForCarryMode(mode: CarryMode): string {
  const today = new Date();
  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    if (mode.activeDays.includes(candidate.getDay())) {
      return `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`;
    }
  }
  return todayISO();
}

export function buildReminderPlan(data: VaultData): Reminder[] {
  const reminders: Reminder[] = [];
  const ts = nowISO();
  data.items
    .filter(item => !item.archived)
    .forEach(item => {
      item.reminderDaysBefore.forEach(daysBefore => {
        if (item.expirationDate) {
          const date = addDays(item.expirationDate, -daysBefore);
          const dateTime = date ? dateTimeFromDateAndTime(date, data.settings.defaultMorningReminderTime) : null;
          if (dateTime && new Date(dateTime).getTime() > Date.now()) {
            reminders.push(reminderForItem(item, 'expiration', dateTime));
          }
        }
        if (item.renewalDate) {
          const date = addDays(item.renewalDate, -daysBefore);
          const dateTime = date ? dateTimeFromDateAndTime(date, data.settings.defaultMorningReminderTime) : null;
          if (dateTime && new Date(dateTime).getTime() > Date.now()) {
            reminders.push(reminderForItem(item, 'renewal', dateTime));
          }
        }
      });
    });

  if (data.settings.dailyCarryCheckEnabled) {
    data.carryModes
      .filter(mode => mode.reminderEnabled)
      .forEach(mode => {
        const date = nextActiveDateForCarryMode(mode);
        const dateTime = dateTimeFromDateAndTime(date, mode.reminderTime);
        if (dateTime && new Date(dateTime).getTime() > Date.now()) {
          reminders.push({
            id: `carry-${mode.id}-${date}`,
            carryModeId: mode.id,
            type: 'daily_carry_check',
            title: `Carry check: ${mode.name}`,
            message: 'Review your carry mode before you leave.',
            scheduledDateTime: dateTime,
            repeatRule: 'active_days',
            enabled: true,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });
  }
  return reminders.sort((a, b) => a.scheduledDateTime.localeCompare(b.scheduledDateTime));
}

export async function rescheduleAllReminders(data: VaultData): Promise<void> {
  if (!PocketVaultNotificationModule) {
    return;
  }
  await PocketVaultNotificationModule.cancelAllNotifications();
  if (!data.settings.notificationsEnabled) {
    return;
  }
  const permission = await canPostNotifications();
  if (!permission) {
    return;
  }
  const plan = buildReminderPlan(data);
  for (const reminder of plan.slice(0, 64)) {
    await PocketVaultNotificationModule.scheduleNotification(
      reminder.id || createId('reminder'),
      reminder.title,
      reminder.message,
      new Date(reminder.scheduledDateTime).getTime(),
    );
  }
}
