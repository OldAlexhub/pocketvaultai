import {CarryMode, UserSettings, VaultItemType} from './types';
import {nowISO} from './utils/date';

export const APP_NAME = 'PocketVault AI';
export const APP_VERSION = '1.0.0';
export const PACKAGE_NAME = 'com.oldalexhub.pocketvaultai';

export const PRIMARY_TAGLINE =
  'Your private offline vault for cards, IDs, documents, and renewal reminders.';

export const DISCLAIMER =
  'PocketVault AI stores personal reference copies only. It does not replace official physical documents, legal IDs, insurance cards, government records, or documents required by authorities.';

export const ITEM_TYPE_LABELS: Record<VaultItemType, string> = {
  identity_reference: 'ID reference',
  vehicle_registration: 'Vehicle registration',
  auto_insurance: 'Auto insurance',
  membership: 'Membership',
  loyalty: 'Loyalty',
  work_school: 'Work or school',
  travel_reference: 'Travel reference',
  health_insurance_reference: 'Health insurance reference',
  warranty: 'Warranty',
  emergency: 'Emergency',
  custom: 'Custom',
};

export const SENSITIVE_DEFAULT_TYPES: VaultItemType[] = [
  'identity_reference',
  'vehicle_registration',
  'auto_insurance',
  'travel_reference',
  'health_insurance_reference',
];

export const TYPE_BADGES: Record<VaultItemType, string> = {
  identity_reference: 'ID',
  vehicle_registration: 'VR',
  auto_insurance: 'AI',
  membership: 'MB',
  loyalty: 'LY',
  work_school: 'WS',
  travel_reference: 'TR',
  health_insurance_reference: 'HI',
  warranty: 'WA',
  emergency: 'EM',
  custom: 'CU',
};

export const DEFAULT_REMINDER_DAYS = [30, 14, 7, 1];

export function createDefaultSettings(): UserSettings {
  const ts = nowISO();
  return {
    onboardingCompleted: false,
    appLockEnabled: false,
    notificationsEnabled: false,
    dailyCarryCheckEnabled: true,
    defaultMorningReminderTime: '08:00',
    defaultEveningReviewTime: '18:00',
    requireUnlockOnLaunch: true,
    lockAfterMinutes: 5,
    themeMode: 'light',
    accentColor: '#1c9a92',
    backupWarningAccepted: false,
    disclaimerAccepted: false,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function createDefaultCarryModes(): CarryMode[] {
  const ts = nowISO();
  const mk = (
    id: string,
    name: string,
    description: string,
    icon: string,
    requiredItemTypes: VaultItemType[],
    activeDays: number[],
    reminderTime = '08:00',
  ): CarryMode => ({
    id,
    name,
    description,
    icon,
    requiredItemTypes,
    requiredItemIds: [],
    reminderEnabled: false,
    reminderTime,
    activeDays,
    createdAt: ts,
    updatedAt: ts,
  });

  return [
    mk('mode-driving', 'Driving', 'Vehicle and auto insurance references for a drive.', 'DR', [
      'vehicle_registration',
      'auto_insurance',
      'identity_reference',
    ], [1, 2, 3, 4, 5, 6, 0]),
    mk('mode-work-day', 'Work Day', 'Work or school cards and common membership references.', 'WK', [
      'work_school',
      'identity_reference',
    ], [1, 2, 3, 4, 5]),
    mk('mode-gym', 'Gym', 'Membership and ID reference for gym visits.', 'GY', [
      'membership',
      'identity_reference',
    ], [1, 2, 3, 4, 5, 6, 0]),
    mk('mode-medical-visit', 'Medical Visit', 'Health insurance and identity references for appointments.', 'MD', [
      'health_insurance_reference',
      'identity_reference',
    ], [1, 2, 3, 4, 5]),
    mk('mode-travel', 'Travel', 'Travel, identity, and membership references.', 'TV', [
      'travel_reference',
      'identity_reference',
    ], [1, 2, 3, 4, 5, 6, 0], '07:00'),
    mk('mode-school-kids', 'School or Kids', 'School, work, emergency, and membership references.', 'SC', [
      'work_school',
      'emergency',
    ], [1, 2, 3, 4, 5]),
    mk('mode-errands', 'Errands', 'Everyday references for quick stops and appointments.', 'ER', [
      'membership',
      'loyalty',
      'identity_reference',
    ], [1, 2, 3, 4, 5, 6, 0]),
  ];
}
