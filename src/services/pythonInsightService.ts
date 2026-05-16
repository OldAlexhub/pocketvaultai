import {AIInsight, InsightResult, VaultData, VaultItem} from '../types';
import {calculateDaysUntil, nowISO, todayISO} from '../utils/date';
import {calculateExpirationStatus} from '../utils/vault';
import {PocketVaultPythonModule} from './nativeModules';

function fallbackInsight(
  type: AIInsight['type'],
  title: string,
  message: string,
  severity: AIInsight['severity'],
  itemIds: string[],
  score: number,
  explanation: string,
): AIInsight {
  return {
    id: `${type}-${itemIds.join('-') || Date.now()}`,
    type,
    title,
    message,
    severity,
    itemIds,
    carryModeIds: [],
    score,
    generatedAt: nowISO(),
    dismissed: false,
    explanation,
  };
}

export function fallbackInsights(data: VaultData): InsightResult {
  const today = todayISO();
  const activeItems = data.items.filter(item => !item.archived);
  const expired = activeItems.filter(item => calculateExpirationStatus(item, today) === 'expired');
  const dueSoon = activeItems.filter(item => calculateExpirationStatus(item, today) === 'due_soon');
  const missingDates = activeItems.filter(item => !item.expirationDate && !item.renewalDate);
  const duplicateMap = new Map<string, VaultItem[]>();
  activeItems.forEach(item => {
    const key = item.title.trim().toLowerCase();
    duplicateMap.set(key, [...(duplicateMap.get(key) ?? []), item]);
  });
  const duplicates = Array.from(duplicateMap.values()).filter(group => group.length > 1);
  let score = 100;
  if (activeItems.length === 0) {
    score -= 20;
  }
  score -= Math.min(25, expired.length * 5);
  score -= Math.min(15, dueSoon.length * 3);
  score -= Math.min(10, missingDates.length);
  score -= Math.min(10, duplicates.length * 2);
  score = Math.max(0, Math.min(100, score));

  const insights: AIInsight[] = [
    fallbackInsight(
      'vault_health',
      'Vault organization score',
      `Your vault organization score is ${score}.`,
      score < 60 ? 'high' : score < 80 ? 'medium' : 'low',
      [],
      score,
      'The fallback score uses local item dates, expired references, due soon references, missing dates, and duplicate names.',
    ),
  ];
  dueSoon.slice(0, 5).forEach(item => {
    const days = calculateDaysUntil(item.expirationDate, today);
    insights.push(
      fallbackInsight(
        'expiring_soon',
        `${item.title} is coming up`,
        `${item.title} has a reference date in ${days} day${days === 1 ? '' : 's'}.`,
        days !== null && days <= 7 ? 'high' : 'medium',
        [item.id],
        days === null ? 0 : 100 - days,
        'This is based only on the expiration date you entered.',
      ),
    );
  });
  if (missingDates.length > 0) {
    insights.push(
      fallbackInsight(
        'review_needed',
        'Some items have no review date',
        `${missingDates.length} saved item${missingDates.length === 1 ? '' : 's'} have no expiration or renewal date.`,
        'low',
        missingDates.map(item => item.id),
        35,
        'Dates help PocketVault AI prioritize reminders and review prompts.',
      ),
    );
  }
  duplicates.forEach(group => {
    insights.push(
      fallbackInsight(
        'duplicate_possible',
        'Possible duplicate items',
        `Review ${group.length} items named ${group[0].title}.`,
        'low',
        group.map(item => item.id),
        30,
        'This is based on matching item titles.',
      ),
    );
  });

  return {
    ok: true,
    source: 'javascript_fallback',
    generatedAt: nowISO(),
    vaultHealth: {
      score,
      label: score >= 80 ? 'Organized' : score >= 60 ? 'Needs review' : 'Needs attention',
      explanation: 'Fallback scoring ran locally because Python insights were unavailable.',
      factors: [
        `${activeItems.length} active item${activeItems.length === 1 ? '' : 's'}`,
        `${dueSoon.length} due soon`,
        `${expired.length} date passed`,
        `${missingDates.length} missing dates`,
      ],
    },
    insights,
    expiringSoon: dueSoon.map(item => ({
      itemId: item.id,
      score: 100 - (calculateDaysUntil(item.expirationDate, today) ?? 0),
      daysUntil: calculateDaysUntil(item.expirationDate, today),
      reason: 'Expiration date is within 30 days.',
    })),
    highPriorityRenewals: [...expired, ...dueSoon.filter(item => (calculateDaysUntil(item.expirationDate, today) ?? 99) <= 7)].map(item => ({
      itemId: item.id,
      score: 100,
      daysUntil: calculateDaysUntil(item.expirationDate, today),
      reason: 'Reference date is passed or within 7 days.',
    })),
    missingDocuments: insights.filter(item => item.type === 'missing_document'),
    duplicateCandidates: insights.filter(item => item.type === 'duplicate_possible'),
  };
}

export async function callPythonInsights(data: VaultData): Promise<InsightResult> {
  const payload = {
    items: data.items,
    carryModes: data.carryModes,
    reminders: data.reminders,
    usageEvents: data.usageEvents,
    settings: data.settings,
    today: todayISO(),
  };
  if (!PocketVaultPythonModule) {
    return fallbackInsights(data);
  }
  try {
    const raw = await PocketVaultPythonModule.analyzeVault(JSON.stringify(payload));
    const parsed = JSON.parse(raw) as InsightResult;
    if (!parsed || !Array.isArray(parsed.insights) || !parsed.vaultHealth) {
      return fallbackInsights(data);
    }
    return {...parsed, source: 'python', ok: true};
  } catch (error) {
    if (__DEV__) {
      console.warn('Python insights failed', error);
    }
    const fallback = fallbackInsights(data);
    return {...fallback, error: 'Smart insights are temporarily unavailable. Your vault still works offline.'};
  }
}
