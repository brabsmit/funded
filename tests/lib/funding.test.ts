import { describe, it, expect } from 'vitest';
import { fundingTree, fmtMoney } from '../../src/lib/funding';

const rows = [
  { id: 'q4', label: 'Question 4', amount: 80_000_000, basis: 'fact' },
  { id: 'refresh', label: 'Refresh', amount: 31_000_000, parent_id: 'q4', basis: 'estimate' },
  { id: 'hvac', label: 'HVAC', parent_id: 'refresh', basis: 'interpretation' },
] as any;

describe('fundingTree', () => {
  it('nests rows under their parent and computes each child share of its parent', () => {
    const t = fundingTree(rows);
    expect(t.map(r => r.id)).toEqual(['q4']);
    expect(t[0].children[0].id).toBe('refresh');
    expect(t[0].children[0].share).toBeCloseTo(0.3875, 4);
    expect(t[0].children[0].children[0].id).toBe('hvac');
    expect(t[0].children[0].children[0].share).toBeUndefined();
  });
  it('depth is recorded for rendering', () => {
    const t = fundingTree(rows);
    expect(t[0].depth).toBe(0);
    expect(t[0].children[0].children[0].depth).toBe(2);
  });
  it('an empty list is an empty tree', () => {
    expect(fundingTree([])).toEqual([]);
  });
});

describe('fmtMoney', () => {
  it('compacts to millions and thousands', () => {
    expect(fmtMoney(80_000_000)).toBe('$80M');
    expect(fmtMoney(31_500_000)).toBe('$31.5M');
    expect(fmtMoney(250_000)).toBe('$250K');
    expect(fmtMoney(900)).toBe('$900');
  });
});
