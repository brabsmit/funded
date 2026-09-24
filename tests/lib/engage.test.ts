import { describe, it, expect } from 'vitest';
import { engageOrder } from '../../src/lib/engage';

const rows = [
  { id: 'vote', venue: 'Vote', date: '2026-11-03', basis: 'fact' },
  { id: 'rule', venue: 'Public comment rule', basis: 'requirement' },
  { id: 'oct8', venue: 'Board Oct 8', date: '2026-10-08', deadline: '2026-10-07', basis: 'fact' },
  { id: 'sep29', venue: 'Work session', date: '2026-09-29', basis: 'fact' },
  { id: 'advisory', venue: 'Advisory councils', deadline: '2026-10-31', basis: 'fact' },
] as any;

describe('engageOrder', () => {
  it('sorts upcoming venues by the date that matters (deadline before date), undated after, past last', () => {
    const o = engageOrder(rows, '2026-10-01');
    expect(o.map(e => e.id)).toEqual(['oct8', 'advisory', 'vote', 'rule', 'sep29']);
  });
  it('computes days left to the deadline or date and flags past ones', () => {
    const o = engageOrder(rows, '2026-10-01');
    const oct8 = o.find(e => e.id === 'oct8')!;
    expect(oct8.closes).toBe('2026-10-07');
    expect(oct8.daysLeft).toBe(6);
    expect(oct8.past).toBe(false);
    expect(o.find(e => e.id === 'sep29')!.past).toBe(true);
    expect(o.find(e => e.id === 'rule')!.daysLeft).toBeUndefined();
  });
  it('a venue on today is still upcoming', () => {
    expect(engageOrder(rows, '2026-11-03').find(e => e.id === 'vote')!.past).toBe(false);
  });
});
