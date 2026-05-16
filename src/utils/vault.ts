import {ITEM_TYPE_LABELS} from '../constants';
import {CarryMode, ExpirationStatus, VaultItem, VaultItemType} from '../types';
import {calculateDaysUntil, todayISO} from './date';

export function calculateExpirationStatus(item: VaultItem, today = todayISO()): ExpirationStatus {
  const days = calculateDaysUntil(item.expirationDate, today);
  if (days === null) {
    return 'no_date';
  }
  if (days < 0) {
    return 'expired';
  }
  if (days <= 30) {
    return 'due_soon';
  }
  if (days <= 90) {
    return 'upcoming';
  }
  return 'active';
}

export function expirationLabel(item: VaultItem, today = todayISO()): string {
  const status = calculateExpirationStatus(item, today);
  const days = calculateDaysUntil(item.expirationDate, today);
  if (status === 'no_date') {
    return 'No date added';
  }
  if (status === 'expired') {
    return `Reference date passed ${Math.abs(days ?? 0)} day${Math.abs(days ?? 0) === 1 ? '' : 's'} ago`;
  }
  if (days === 0) {
    return 'Date is today';
  }
  return `${days} day${days === 1 ? '' : 's'} remaining`;
}

export function reminderPriority(item: VaultItem, today = todayISO()): 'high' | 'medium' | 'low' | 'none' {
  const days = calculateDaysUntil(item.expirationDate || item.renewalDate, today);
  if (days === null) {
    return 'none';
  }
  if (days < 0 || days <= 7) {
    return 'high';
  }
  if (days <= 30) {
    return 'medium';
  }
  if (days <= 90) {
    return 'low';
  }
  return 'none';
}

export function searchVaultItems(items: VaultItem[], query: string): VaultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items;
  }
  return items.filter(item => {
    const haystack = [
      item.title,
      item.categoryLabel,
      item.ownerName,
      item.issuer,
      item.memberNumber,
      item.documentNumberMasked,
      item.notes,
      item.tags.join(' '),
      ITEM_TYPE_LABELS[item.type],
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterVaultItems(items: VaultItem[], filter: string, today = todayISO()): VaultItem[] {
  return items.filter(item => {
    if (filter !== 'Archived' && item.archived) {
      return false;
    }
    if (filter === 'All') {
      return true;
    }
    if (filter === 'Favorites') {
      return item.favorite;
    }
    if (filter === 'Expiring') {
      return calculateExpirationStatus(item, today) === 'due_soon';
    }
    if (filter === 'Expired') {
      return calculateExpirationStatus(item, today) === 'expired';
    }
    if (filter === 'Vehicle') {
      return item.type === 'vehicle_registration' || item.type === 'auto_insurance';
    }
    if (filter === 'Membership') {
      return item.type === 'membership' || item.type === 'loyalty';
    }
    if (filter === 'Archived') {
      return item.archived;
    }
    return true;
  });
}

export function itemMatchesCarryRequirement(item: VaultItem, mode: CarryMode): boolean {
  if (item.archived) {
    return false;
  }
  return mode.requiredItemIds.includes(item.id) || mode.requiredItemTypes.includes(item.type);
}

export function runCarryCheck(items: VaultItem[], mode: CarryMode): VaultItem[] {
  return items.filter(item => itemMatchesCarryRequirement(item, mode));
}

export function labelForType(type: VaultItemType): string {
  return ITEM_TYPE_LABELS[type] ?? 'Custom';
}
