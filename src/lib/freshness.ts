import type { MilestoneT, SchoolT } from '../schema/records';
import { daysUntil, fmtDate } from './dates';

export type Stale = { school: string; need: string; milestone: string; date: string; daysPast: number };

/** "Next" milestones whose date is more than `graceDays` behind `today`: the record says something is
 *  upcoming that has already happened (or not). Draft records count too; they are on the home page. */
export function staleMilestones(schools: Pick<SchoolT, 'id' | 'needs'>[], today: string, graceDays: number): Stale[] {
  return schools.flatMap(s => s.needs.flatMap(n => n.milestones
    .filter(m => m.status === 'next')
    .map(m => ({ school: s.id, need: n.id, milestone: m.id, date: m.date, daysPast: -daysUntil(today, m.date) }))
    .filter(x => x.daysPast > graceDays)));
}

/** The one-line "what is next" for a school card; once the date passes it says so instead of calling it next. */
export function nextLine(m: Pick<MilestoneT, 'date' | 'decider'>, today: string): string {
  if (daysUntil(today, m.date) >= 0) return `Next: ${m.decider ? `${m.decider}, ` : ''}${fmtDate(m.date)}`;
  return `Was due ${fmtDate(m.date)}${m.decider ? ` (${m.decider})` : ''}, not confirmed since`;
}
