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
