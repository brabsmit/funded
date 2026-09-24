import { describe, it, expect } from 'vitest';
import { timeScale } from '../../src/lib/scale';

const need = {
  id: 'hvac',
  milestones: [
    { id: 'm1', date: '2026-06-18', label: 'CIP adopted', status: 'done', basis: 'fact' },
    { id: 'm2', date: '2026-11-03', label: 'Bond vote', status: 'next', basis: 'fact' },
    { id: 'm3', date: '2029-01-01', label: 'Done', status: 'later', basis: 'estimate' },
  ],
  inquiries: [
    { id: 'q1', date: '2026-04-15', to: 'Superintendent', question: 'Plan?', status: 'partial' },
    { id: 'q2', to: 'Facilities', question: 'If it fails?', status: 'open' },
  ],
} as any;

describe('timeScale', () => {
  it('spans from the earliest dated inquiry to the last milestone', () => {
    const s = timeScale(need, '2026-09-24');
    expect(s.start).toBe('2026-04-15');
    expect(s.end).toBe('2029-01-01');
  });
  it('places every dated event and today as a percentage of the span', () => {
    const s = timeScale(need, '2026-09-24');
    expect(s.points.map(p => p.id)).toEqual(['q1', 'm1', 'm2', 'm3']);
    expect(s.points[0].pct).toBe(0);
    expect(s.points[3].pct).toBe(100);
    expect(s.points[2].pct).toBeCloseTo(20.4, 0);
    expect(s.todayPct).toBeCloseTo(16.3, 0);
    expect(s.points[0].kind).toBe('inquiry');
    expect(s.points[1].kind).toBe('milestone');
  });
  it('lists the years that fall inside the span as axis ticks', () => {
    expect(timeScale(need, '2026-09-24').yearTicks.map(t => t.year)).toEqual([2027, 2028, 2029]);
  });
  it('falls back to the milestones alone when there is no dated inquiry', () => {
    const s = timeScale({ ...need, inquiries: [] }, '2026-09-24');
    expect(s.start).toBe('2026-06-18');
  });
  it('clamps today inside the span', () => {
    expect(timeScale(need, '2031-01-01').todayPct).toBe(100);
  });
});
