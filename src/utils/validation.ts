import {DEFAULT_REMINDER_DAYS, ITEM_TYPE_LABELS} from '../constants';
import {ITEM_TYPES, ValidationResult, VaultItem, VaultItemType, VehicleProfile} from '../types';
import {isValidISODate, isValidTime, parseISODate} from './date';

export function parseReminderDays(value: string): number[] {
  if (!value.trim()) {
    return DEFAULT_REMINDER_DAYS;
  }
  const parsed = value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(value => Number.isInteger(value) && value > 0);
  return Array.from(new Set(parsed)).sort((a, b) => b - a);
}

export function validateVaultItem(item: Partial<VaultItem>): ValidationResult {
  const errors: Record<string, string> = {};
  const title = item.title?.trim() ?? '';
  if (title.length < 2 || title.length > 80) {
    errors.title = 'Title must be 2 to 80 characters.';
  }
  if (!item.type || !ITEM_TYPES.includes(item.type as VaultItemType)) {
    errors.type = 'Choose a valid item type.';
  }
  if (item.issueDate && !isValidISODate(item.issueDate)) {
    errors.issueDate = 'Use YYYY-MM-DD.';
  }
  if (item.expirationDate && !isValidISODate(item.expirationDate)) {
    errors.expirationDate = 'Use YYYY-MM-DD.';
  }
  if (item.renewalDate && !isValidISODate(item.renewalDate)) {
    errors.renewalDate = 'Use YYYY-MM-DD.';
  }
  const issue = parseISODate(item.issueDate);
  const expires = parseISODate(item.expirationDate);
  if (issue && expires && expires.getTime() < issue.getTime()) {
    errors.expirationDate = 'Expiration cannot be before issue date.';
  }
  if ((item.reminderDaysBefore ?? []).some(value => !Number.isInteger(value) || value <= 0)) {
    errors.reminderDaysBefore = 'Reminder days must be positive numbers.';
  }
  if ((item.tags ?? []).length > 12) {
    errors.tags = 'Use 12 tags or fewer.';
  }
  if ((item.notes ?? '').length > 1500) {
    errors.notes = 'Notes must be 1500 characters or fewer.';
  }
  if ((item.memberNumber ?? '').length > 80) {
    errors.memberNumber = 'Member number must be 80 characters or fewer.';
  }
  if ((item.documentNumberSensitive ?? '').length > 120) {
    errors.documentNumberSensitive = 'Sensitive number must be 120 characters or fewer.';
  }
  return {valid: Object.keys(errors).length === 0, errors};
}

export function validateVehicleProfile(profile: Partial<VehicleProfile>): ValidationResult {
  const errors: Record<string, string> = {};
  if (!profile.nickname?.trim()) {
    errors.nickname = 'Nickname is required.';
  }
  const currentYear = new Date().getFullYear();
  if (profile.year && (profile.year < 1900 || profile.year > currentYear + 2)) {
    errors.year = `Year must be between 1900 and ${currentYear + 2}.`;
  }
  if ((profile.plateMasked ?? '').length > 20) {
    errors.plateMasked = 'Plate must be 20 characters or fewer.';
  }
  if ((profile.vinMasked ?? '').length > 30) {
    errors.vinMasked = 'VIN must be 30 characters or fewer.';
  }
  return {valid: Object.keys(errors).length === 0, errors};
}

export function validateCarryMode(name: string, time: string): ValidationResult {
  const errors: Record<string, string> = {};
  if (name.trim().length < 2) {
    errors.name = 'Name is required.';
  }
  if (!isValidTime(time)) {
    errors.reminderTime = 'Use HH:mm time.';
  }
  return {valid: Object.keys(errors).length === 0, errors};
}

export function sanitizeTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );
}

export function defaultCategoryForType(type: VaultItemType): string {
  return ITEM_TYPE_LABELS[type] ?? 'Custom';
}
