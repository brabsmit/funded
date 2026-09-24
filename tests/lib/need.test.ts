import { describe, it, expect } from 'vitest';
import { stagesFor, nextMilestone, decidersFor } from '../../src/lib/need';

const track = { id: 'cip', stages: [
  { id: 'a', order: 1, name: 'A', decider: 'Board', basis: 'requirement' },
  { id: 'b', order: 2, name: 'B', decider: 'Voters', basis: 'requirement' },
  { id: 'c', order: 3, name: 'C', decider: 'Facilities', basis: 'requirement' },
] } as any;
const need = { id: 'hvac', track_id: 'cip', current_stage_id: 'b', milestones: [
  { id: 'm1', date: '2026-06-01', label: 'x', status: 'done', basis: 'fact' },
  { id: 'm2', date: '2026-11-03', label: 'y', status: 'next', basis: 'fact' },
  { id: 'm3', date: '2027-06-01', label: 'z', status: 'later', basis: 'estimate' },
] } as any;

describe('need helpers', () => {
  it('stagesFor marks stages before current as done, current, after as later', () => {
    expect(stagesFor(need, track).map(s => s.state)).toEqual(['done', 'current', 'later']);
  });
  it('nextMilestone returns the one with status next', () => {
    expect(nextMilestone(need)?.id).toBe('m2');
  });
  it('decidersFor returns current and following stage', () => {
    const d = decidersFor(need, track);
    expect(d.current.id).toBe('b');
    expect(d.next?.id).toBe('c');
  });
  it('decidersFor has no next at the final stage', () => {
    expect(decidersFor({ ...need, current_stage_id: 'c' }, track).next).toBeUndefined();
  });
});
