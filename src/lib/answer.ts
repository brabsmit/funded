import type { NeedT, TrackT, StageT, MilestoneT } from '../schema/records';
import { decidersFor, nextMilestone } from './need';
import { engageOrder, type EngageItem } from './engage';
import { daysUntil, yearsUntil } from './dates';

export type ShortAnswer = {
  stage: StageT;
  next: MilestoneT & { daysLeft: number };
  after?: StageT;
  move?: EngageItem;
  finish?: { date: string; yearsLeft: number };
};

/** The three-line answer a parent came for, derived from the record. */
export function shortAnswer(need: NeedT, track: TrackT, today: string): ShortAnswer {
  const { current, next: after } = decidersFor(need, track);
  const nm = nextMilestone(need);
  if (!nm) throw new Error(`need ${need.id}: no milestone with status "next"`);
  const last = need.milestones[need.milestones.length - 1];
  const finish = last && last.date > nm.date ? { date: last.date, yearsLeft: yearsUntil(today, last.date) } : undefined;
  const move = engageOrder(need.engage, today).find(e => !e.past && e.closes);
  return { stage: current, next: { ...nm, daysLeft: daysUntil(today, nm.date) }, after, move, finish };
}
