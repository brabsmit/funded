import type { EngageT } from '../schema/records';
import { daysUntil } from './dates';

export type EngageItem = EngageT & { closes?: string; daysLeft?: number; past: boolean };

/** Soonest actionable venue first: sorted by the deadline if there is one, else the date; undated venues after; past venues last. */
export function engageOrder(rows: EngageT[], today: string): EngageItem[] {
  const items: EngageItem[] = rows.map(e => {
    const closes = e.deadline ?? e.date;
    const daysLeft = closes ? daysUntil(today, closes) : undefined;
    return { ...e, closes, daysLeft, past: daysLeft !== undefined && daysLeft < 0 };
  });
  const rank = (e: EngageItem) => (e.past ? 2 : e.closes ? 0 : 1);
  return items.sort((a, b) => rank(a) - rank(b) || (a.closes ?? '').localeCompare(b.closes ?? ''));
}
