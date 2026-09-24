import { describe, it, expect } from 'vitest';
import { daysUntil, fmtDate, yearsUntil } from '../../src/lib/dates';

describe('dates', () => {
  it('daysUntil counts calendar days, negative when the date has passed', () => {
    expect(daysUntil('2026-09-24', '2026-11-03')).toBe(40);
    expect(daysUntil('2026-09-24', '2026-09-24')).toBe(0);
    expect(daysUntil('2026-09-24', '2026-09-20')).toBe(-4);
  });
  it('yearsUntil rounds to one decimal', () => {
    expect(yearsUntil('2026-09-24', '2029-01-01')).toBe(2.3);
  });
  it('fmtDate renders a short US date without timezone drift', () => {
    expect(fmtDate('2026-11-03')).toBe('Nov 3, 2026');
  });
});
