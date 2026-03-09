import type { JournalEntry, MealEntry, WeightEntry, WorkoutEntry } from '../api/types.js';
import { formatDateKeyLocal, isWithinLastDays } from './time.js';

export interface WeightSummary {
  latest: string;
  delta7d: string;
}

export function calculateWeightSummary(entries: WeightEntry[]): WeightSummary {
  if (entries.length === 0) {
    return { latest: '--', delta7d: '--' };
  }

  const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const latestEntry = sorted[sorted.length - 1];
  if (!latestEntry) {
    return { latest: '--', delta7d: '--' };
  }

  const latestDate = new Date(latestEntry.timestamp);
  const sevenDaysAgo = new Date(latestDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const baseline = sorted.find(entry => new Date(entry.timestamp) >= sevenDaysAgo) ?? sorted[0];
  if (!baseline) {
    return { latest: '--', delta7d: '--' };
  }

  const delta = latestEntry.weight - baseline.weight;
  const sign = delta > 0 ? '+' : '';

  return {
    latest: `${latestEntry.weight.toFixed(1)} lbs`,
    delta7d: `${sign}${delta.toFixed(1)} lbs`
  };
}

export function calculateWorkoutsThisWeek(entries: WorkoutEntry[]): number {
  return entries.filter(entry => isWithinLastDays(entry.timestamp, 7)).length;
}

export interface JournalSummary {
  total: string;
  latest: string;
}

export function calculateJournalSummary(entries: JournalEntry[], formatter: (timestamp: string) => string): JournalSummary {
  if (entries.length === 0) {
    return { total: '0', latest: '--' };
  }

  const latest = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  return {
    total: String(entries.length),
    latest: latest ? formatter(latest.timestamp) : '--'
  };
}

export interface MealSummary {
  mealsToday: string;
  caloriesToday: string;
  calories7dAvg: string;
}

export function calculateMealSummary(entries: MealEntry[]): MealSummary {
  const now = new Date();
  const todayKey = formatDateKeyLocal(now);
  const sevenDayTotals = new Map<string, number>();

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    sevenDayTotals.set(formatDateKeyLocal(date), 0);
  }

  let mealsToday = 0;
  let caloriesToday = 0;

  entries.forEach(entry => {
    const dateKey = formatDateKeyLocal(new Date(entry.timestamp));
    if (dateKey === todayKey) {
      mealsToday += 1;
      caloriesToday += entry.calories ?? 0;
    }

    if (sevenDayTotals.has(dateKey)) {
      sevenDayTotals.set(dateKey, (sevenDayTotals.get(dateKey) ?? 0) + (entry.calories ?? 0));
    }
  });

  const avg = Math.round(Array.from(sevenDayTotals.values()).reduce((sum, n) => sum + n, 0) / 7);

  return {
    mealsToday: String(mealsToday),
    caloriesToday: `${caloriesToday} kcal`,
    calories7dAvg: `${avg} kcal`
  };
}
