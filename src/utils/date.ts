export function nowISO(): string {
  return new Date().toISOString();
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isValidISODate(value?: string): boolean {
  return parseISODate(value) !== null;
}

export function calculateDaysUntil(dateValue?: string, todayValue = todayISO()): number | null {
  const target = parseISODate(dateValue);
  const today = parseISODate(todayValue);
  if (!target || !today) {
    return null;
  }
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function addDays(dateValue: string, days: number): string | null {
  const date = parseISODate(dateValue);
  if (!date || !Number.isFinite(days)) {
    return null;
  }
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function dateTimeFromDateAndTime(dateValue: string, hhmm: string): string | null {
  const date = parseISODate(dateValue);
  if (!date || !/^\d{2}:\d{2}$/.test(hhmm)) {
    return null;
  }
  const [hour, minute] = hhmm.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function formatDate(value?: string): string {
  const date = parseISODate(value);
  if (!date) {
    return 'Not added';
  }
  return date.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return 'Not scheduled';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isValidTime(value?: string): boolean {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
