import { describe, it, expect } from 'vitest';
import { shortAnswer } from '../../src/lib/answer';

const track = { id: 'cip', name: 'Capital Improvement Plan', stages: [
  { id: 'a', order: 1, name: 'CIP adoption', decider: 'School Board', basis: 'fact' },
  { id: 'b', order: 2, name: 'Bond referendum', decider: 'Arlington voters', venue: 'General election', basis: 'fact' },
  { id: 'c', order: 3, name: 'Design', decider: 'School Board', basis: 'estimate' },
] } as any;
const need = {
  id: 'hvac', track_id: 'cip', current_stage_id: 'b',
  milestones: [
    { id: 'm1', date: '2026-06-18', label: 'CIP adopted', status: 'done', basis: 'fact' },
    { id: 'm2', date: '2026-11-03', label: 'Voters decide the bond', status: 'next', decider: 'Arlington voters', basis: 'fact' },
    { id: 'm3', date: '2029-01-01', label: 'Done', status: 'later', basis: 'estimate' },
  ],
  engage: [
    { id: 'vote', venue: 'Vote', date: '2026-11-03', basis: 'fact' },
    { id: 'oct8', venue: 'Board Oct 8', date: '2026-10-08', deadline: '2026-10-07', ask: 'When does design start?', basis: 'fact' },
  ],
  inquiries: [], funding: [],
} as any;

describe('shortAnswer', () => {
  it('names the current stage, the next decision with countdown, the next decider, and the soonest move', () => {
    const a = shortAnswer(need, track, '2026-09-24');
    expect(a.stage.name).toBe('Bond referendum');
    expect(a.next.label).toBe('Voters decide the bond');
    expect(a.next.daysLeft).toBe(40);
    expect(a.next.decider).toBe('Arlington voters');
    expect(a.after?.decider).toBe('School Board');
    expect(a.move?.id).toBe('oct8');
    expect(a.finish).toEqual({ date: '2029-01-01', yearsLeft: 2.3 });
  });
  it('has no move when every venue has passed', () => {
    expect(shortAnswer(need, track, '2027-01-01').move).toBeUndefined();
  });
});
