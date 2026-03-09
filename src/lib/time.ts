export function formatDateKeyUtc(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function formatDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isWithinLastDays(timestamp: string, days: number, now: Date = new Date()): boolean {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const target = new Date(timestamp);
  return target >= cutoff && target <= now;
}
