import { describe, it, expect } from 'vitest';
import { staleMilestones, nextLine } from '../../src/lib/freshness';

const school = (id: string, status: 'live' | 'draft', next: { date: string; decider?: string }) => ({
  id, status, needs: [{ id: `${id}-need`, milestones: [
    { id: `${id}-done`, date: '2026-06-18', label: 'Adopted', status: 'done', basis: 'fact' },
    { id: `${id}-next`, label: 'Next step', status: 'next', basis: 'estimate', ...next },
  ] }],
}) as any;

describe('staleMilestones', () => {
  it('flags a next milestone more than the grace period past, for live and draft records', () => {
    const out = staleMilestones([school('a', 'draft', { date: '2026-08-31' }), school('b', 'live', { date: '2026-09-20' })], '2026-10-03', 7);
    expect(out.map(s => [s.school, s.milestone, s.daysPast])).toEqual([['a', 'a-next', 33], ['b', 'b-next', 13]]);
  });
  it('ignores milestones inside the grace period and future ones', () => {
    expect(staleMilestones([school('a', 'live', { date: '2026-09-30' }), school('b', 'live', { date: '2026-11-03' })], '2026-10-03', 7)).toEqual([]);
  });
  it('ignores done and later milestones even when their dates have passed', () => {
    expect(staleMilestones([school('a', 'live', { date: '2026-11-03' })], '2027-01-01', 7).map(s => s.milestone)).toEqual(['a-next']);
  });
});

describe('nextLine', () => {
  it('reads "Next" while the date is ahead or today', () => {
    expect(nextLine({ date: '2026-11-03', decider: 'Arlington voters' } as any, '2026-10-03')).toBe('Next: Arlington voters, Nov 3, 2026');
    expect(nextLine({ date: '2026-10-03' } as any, '2026-10-03')).toBe('Next: Oct 3, 2026');
  });
  it('says the date passed without confirmation once it is behind us', () => {
    expect(nextLine({ date: '2026-08-31', decider: 'APS Facilities and Operations' } as any, '2026-10-03'))
      .toBe('Was due Aug 31, 2026 (APS Facilities and Operations), not confirmed since');
  });
});
