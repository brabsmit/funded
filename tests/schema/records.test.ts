import { describe, it, expect } from 'vitest';
import { School, Track } from '../../src/schema/records';
import { claimsOf, unsourcedClaims } from '../../src/schema/claims';

const source = { id: 'cip-2027', title: 'APS CIP FY2027-2036', url: 'https://www.apsva.us/cip', retrieved_on: '2026-09-24' };

const need = {
  id: 'hvac', title: 'HVAC replacement', track_id: 'cip', current_stage_id: 'cip-funding',
  stage_basis: 'fact', stage_source_id: 'cip-2027',
  cost: '$31M', cost_basis: 'estimate', cost_source_id: 'cip-2027',
  window: 'Summer 2027-2029', window_basis: 'estimate', window_source_id: 'cip-2027',
  milestones: [
    { id: 'bond', date: '2026-11-03', label: 'Bond referendum', status: 'next', basis: 'fact', source_id: 'cip-2027' },
  ],
  engage: [
    { id: 'board', venue: 'School Board meeting', basis: 'fact', source_id: 'cip-2027' },
  ],
  inquiries: [],
};

const school = (overrides: object) => ({
  id: 'oakridge', name: 'Oakridge Elementary', district: 'Arlington Public Schools',
  status: 'live', needs: [need], sources: [source], ...overrides,
});

describe('claimsOf', () => {
  it('enumerates stage, cost, window, milestones, engage', () => {
    const labels = claimsOf(need as any).map(c => c.label);
    expect(labels).toEqual(['stage', 'cost', 'window', 'milestone:bond', 'engage:board']);
  });
  it('omits cost and window claims when absent', () => {
    const { cost, cost_basis, cost_source_id, window, window_basis, window_source_id, ...rest } = need;
    expect(claimsOf(rest as any).map(c => c.label)).toEqual(['stage', 'milestone:bond', 'engage:board']);
  });
  it('unsourcedClaims returns claims with no source_id', () => {
    const n = { ...need, cost_source_id: undefined };
    expect(unsourcedClaims(n as any).map(c => c.label)).toEqual(['cost']);
  });
});

describe('School schema', () => {
  it('accepts a fully sourced live school', () => {
    expect(School.safeParse(school({})).success).toBe(true);
  });
  it('rejects a live school with an unsourced claim, naming it', () => {
    const r = School.safeParse(school({ needs: [{ ...need, cost_source_id: undefined }] }));
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('cost');
  });
  it('accepts a draft school with an unsourced claim', () => {
    const r = School.safeParse(school({ status: 'draft', needs: [{ ...need, cost_source_id: undefined }] }));
    expect(r.success).toBe(true);
  });
  it('rejects a source_id that is not in the school sources list', () => {
    const r = School.safeParse(school({ needs: [{ ...need, cost_source_id: 'nope' }] }));
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('nope');
  });
  it('rejects bad ids and bad dates', () => {
    expect(School.safeParse(school({ id: 'Oak Ridge' })).success).toBe(false);
    const r = School.safeParse(school({ needs: [{ ...need, milestones: [{ ...need.milestones[0], date: '11/03/2026' }] }] }));
    expect(r.success).toBe(false);
  });
});

describe('Track schema', () => {
  it('requires at least one stage and a verification value', () => {
    const t = { id: 'cip', name: 'Capital (CIP)', description: 'x', routing_rule: 'y', verification: 'draft', stages: [], sources: [] };
    expect(Track.safeParse(t).success).toBe(false);
    const ok = { ...t, stages: [{ id: 'cip-funding', order: 1, name: 'Funding', decider: 'School Board', basis: 'requirement' }] };
    expect(Track.safeParse(ok).success).toBe(true);
  });
});

describe('depth fields (why_track, engage dates, open inquiries, funding)', () => {
  it('a need may carry a why_track claim that counts as a claim', () => {
    const n = { ...need, why_track: 'Whole-system replacement; listed in the CIP', why_track_basis: 'interpretation' };
    expect(claimsOf(n as any).map(c => c.label)).toContain('why_track');
    expect(unsourcedClaims(n as any).map(c => c.label)).toEqual(['why_track']);
    expect(School.safeParse(school({ needs: [{ ...n, why_track_source_id: 'cip-2027' }] })).success).toBe(true);
  });
  it('engage rows accept a date, a deadline, and an ask; dates must be ISO', () => {
    const e = { id: 'oct8', venue: 'Board meeting', date: '2026-10-08', deadline: '2026-10-07', ask: 'When does design start?', basis: 'fact', source_id: 'cip-2027' };
    expect(School.safeParse(school({ needs: [{ ...need, engage: [e] }] })).success).toBe(true);
    expect(School.safeParse(school({ needs: [{ ...need, engage: [{ ...e, deadline: 'Oct 7' }] }] })).success).toBe(false);
  });
  it('an inquiry with status open needs no date', () => {
    const q = { id: 'if-bond-fails', to: 'APS Facilities', question: 'What happens if Question 4 fails?', status: 'open' };
    expect(School.safeParse(school({ needs: [{ ...need, inquiries: [q] }] })).success).toBe(true);
    expect(School.safeParse(school({ needs: [{ ...need, inquiries: [{ ...q, status: 'partial' }] }] })).success).toBe(false);
  });
  it('funding rows are claims and parent_id must name another funding row of the same need', () => {
    const f80 = { id: 'q4', label: 'Question 4 school bond', amount: 80_000_000, basis: 'fact', source_id: 'cip-2027' };
    const f31 = { id: 'refresh', label: 'Oakridge Refresh', amount: 31_000_000, parent_id: 'q4', basis: 'estimate', source_id: 'cip-2027' };
    const hvac = { id: 'hvac', label: 'HVAC', parent_id: 'refresh', basis: 'interpretation', source_id: 'cip-2027' };
    const n = { ...need, funding: [f80, f31, hvac] };
    expect(claimsOf(n as any).map(c => c.label)).toEqual(expect.arrayContaining(['funding:q4', 'funding:refresh', 'funding:hvac']));
    expect(School.safeParse(school({ needs: [n] })).success).toBe(true);
    const bad = School.safeParse(school({ needs: [{ ...need, funding: [{ ...f31, parent_id: 'ghost' }] }] }));
    expect(bad.success).toBe(false);
    expect(JSON.stringify(bad.error?.issues)).toContain('ghost');
    const unsourced = School.safeParse(school({ needs: [{ ...need, funding: [{ ...f80, source_id: undefined }] }] }));
    expect(unsourced.success).toBe(false);
  });
});
