import type { NeedT } from '../schema/records';
import { daysUntil } from './dates';

export type ScalePoint = { id: string; date: string; label: string; kind: 'milestone' | 'inquiry'; status: string; pct: number };
export type TimeScale = { start: string; end: string; today: string; todayPct: number; points: ScalePoint[]; yearTicks: Array<{ year: number; pct: number }> };

/** Positions every dated event of a need on one proportional axis: from the first question anyone asked to the last planned milestone. */
export function timeScale(need: Pick<NeedT, 'milestones' | 'inquiries'>, today: string): TimeScale {
  const events: Array<Omit<ScalePoint, 'pct'>> = [
    ...need.inquiries.filter(q => q.date).map(q => ({ id: q.id, date: q.date!, label: `Asked ${q.to}`, kind: 'inquiry' as const, status: q.status })),
    ...need.milestones.map(m => ({ id: m.id, date: m.date, label: m.label, kind: 'milestone' as const, status: m.status })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  if (events.length === 0) throw new Error('timeScale: need has no dated events');
  const start = events[0].date;
  const end = events[events.length - 1].date;
  const span = Math.max(1, daysUntil(start, end));
  const pctOf = (d: string) => Math.min(100, Math.max(0, (daysUntil(start, d) / span) * 100));
  const yearTicks: Array<{ year: number; pct: number }> = [];
  for (let y = +start.slice(0, 4) + 1; y <= +end.slice(0, 4); y++) yearTicks.push({ year: y, pct: pctOf(`${y}-01-01`) });
  return { start, end, today, todayPct: pctOf(today), points: events.map(e => ({ ...e, pct: pctOf(e.date) })), yearTicks };
}
