export const ITEM_TYPES = [
  'identity_reference',
  'vehicle_registration',
  'auto_insurance',
  'membership',
  'loyalty',
  'work_school',
  'travel_reference',
  'health_insurance_reference',
  'warranty',
  'emergency',
  'custom',
] as const;

export type VaultItemType = (typeof ITEM_TYPES)[number];

export type ExpirationStatus = 'expired' | 'due_soon' | 'upcoming' | 'active' | 'no_date';

export type ReminderType =
  | 'expiration'
  | 'renewal'
  | 'daily_carry_check'
  | 'review'
  | 'custom';

export type UsageEventType =
  | 'viewed'
  | 'used'
  | 'exported'
  | 'reminder_dismissed'
  | 'reminder_completed'
  | 'carry_check_completed';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AIInsightType =
  | 'expiring_soon'
  | 'missing_document'
  | 'duplicate_possible'
  | 'review_needed'
  | 'carry_mode_suggestion'
  | 'vault_health'
  | 'high_priority';

export type InsightSeverity = 'low' | 'medium' | 'high';

export interface VaultItem {
  id: string;
  title: string;
  type: VaultItemType;
  categoryLabel: string;
  ownerName?: string;
  linkedVehicleId?: string;
  issuer?: string;
  memberNumber?: string;
  documentNumberMasked?: string;
  documentNumberSensitive?: string;
  frontImageUri?: string;
  backImageUri?: string;
  issueDate?: string;
  expirationDate?: string;
  renewalDate?: string;
  reminderDaysBefore: number[];
  notes?: string;
  tags: string[];
  colorLabel?: string;
  favorite: boolean;
  sensitive: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
  lastUsedAt?: string;
}

export interface VehicleProfile {
  id: string;
  nickname: string;
  year?: number;
  make?: string;
  model?: string;
  plateMasked?: string;
  vinMasked?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarryMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredItemTypes: VaultItemType[];
  requiredItemIds: string[];
  reminderEnabled: boolean;
  reminderTime: string;
  activeDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  itemId?: string;
  carryModeId?: string;
  type: ReminderType;
  title: string;
  message: string;
  scheduledDateTime: string;
  repeatRule?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
}

export interface UsageEvent {
  id: string;
  itemId?: string;
  carryModeId?: string;
  eventType: UsageEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserSettings {
  onboardingCompleted: boolean;
  appLockEnabled: boolean;
  notificationsEnabled: boolean;
  dailyCarryCheckEnabled: boolean;
  defaultMorningReminderTime: string;
  defaultEveningReviewTime: string;
  requireUnlockOnLaunch: boolean;
  lockAfterMinutes: number;
  themeMode: ThemeMode;
  accentColor: string;
  backupWarningAccepted: boolean;
  disclaimerAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIInsight {
  id: string;
  type: AIInsightType;
  title: string;
  message: string;
  severity: InsightSeverity;
  itemIds: string[];
  carryModeIds: string[];
  score: number;
  generatedAt: string;
  dismissed: boolean;
  explanation: string;
}

export interface VaultHealth {
  score: number;
  label: string;
  explanation: string;
  factors: string[];
}

export interface InsightResult {
  ok: boolean;
  source: 'python' | 'javascript_fallback';
  generatedAt: string;
  vaultHealth: VaultHealth;
  insights: AIInsight[];
  expiringSoon: Array<{itemId: string; score: number; daysUntil: number | null; reason: string}>;
  highPriorityRenewals: Array<{itemId: string; score: number; daysUntil: number | null; reason: string}>;
  missingDocuments: AIInsight[];
  duplicateCandidates: AIInsight[];
  suggestedCarryModeId?: string;
  error?: string;
}

export interface VaultData {
  appVersion: string;
  items: VaultItem[];
  vehicleProfiles: VehicleProfile[];
  carryModes: CarryMode[];
  reminders: Reminder[];
  usageEvents: UsageEvent[];
  settings: UserSettings;
}

export interface BackupFile {
  appName: string;
  appVersion: string;
  exportVersion: number;
  exportedAt: string;
  disclaimer: string;
  encryptedSensitiveFieldsNotice: string;
  items: VaultItem[];
  vehicleProfiles: VehicleProfile[];
  carryModes: CarryMode[];
  reminders: Reminder[];
  settings: Omit<UserSettings, 'appLockEnabled' | 'requireUnlockOnLaunch'> & {
    appLockEnabled: false;
    requireUnlockOnLaunch: false;
  };
  usageEvents?: UsageEvent[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
