import { describe, it, expect } from 'vitest';
import { assemble } from '../../scripts/sync/assemble';
import { goodTabs } from './fixtures';

const msgs = (r: ReturnType<typeof assemble>) => r.errors.map(e => `${e.tab}${e.row ? ':' + e.row : ''} ${e.message}`);

describe('assemble', () => {
  it('builds denormalized tracks and schools from a good sheet', () => {
    const r = assemble(goodTabs());
    expect(r.errors).toEqual([]);
    expect(r.tracks).toHaveLength(1);
    expect(r.tracks[0].stages.map(s => s.id)).toEqual(['cip-plan', 'cip-funding', 'cip-design']);
    expect(r.tracks[0].sources.map(s => s.id)).toEqual(['cip-2027']);
    const need = r.schools[0].needs[0];
    expect(need.milestones.map(m => m.id)).toEqual(['cip-adopted', 'bond']);
    expect(need.engage[0].id).toBe('board');
    expect(need.inquiries[0].id).toBe('apr-email');
    expect(r.schools[0].sources.map(s => s.id)).toEqual(['cip-2027']);
  });

  it('sorts stages by order and milestones by date regardless of sheet order', () => {
    const t = goodTabs();
    t.Stages.reverse(); t.Milestones.reverse();
    const r = assemble(t);
    expect(r.tracks[0].stages.map(s => s.order)).toEqual([1, 2, 3]);
    expect(r.schools[0].needs[0].milestones.map(m => m.date)).toEqual(['2026-06-18', '2026-11-03']);
  });

  it('reports a need whose track does not exist, with the sheet row number', () => {
    const t = goodTabs(); t.Needs[0].track_id = 'nope';
    expect(msgs(assemble(t))).toContain('Needs:2 need "hvac": unknown track_id "nope"');
  });

  it('current stage must belong to the need\'s track', () => {
    const t = goodTabs();
    t.Tracks.push({ track_id: 'gift', name: 'Equipment gift', description: 'x', routing_rule: 'y', verification: 'draft' });
    t.Stages.push({ stage_id: 'gift-offer', track_id: 'gift', order: '1', name: 'Offer', decider: 'Principal', basis: 'requirement', source_id: 'cip-2027' });
    t.Needs[0].current_stage_id = 'gift-offer';
    expect(msgs(assemble(t))).toContain('Needs:2 need "hvac": current_stage_id "gift-offer" is not a stage of track "cip"');
  });

  it('exactly one next milestone per need', () => {
    const t = goodTabs();
    t.Milestones[0].status = 'next';
    expect(msgs(assemble(t))).toContain('Milestones need "hvac": expected exactly one milestone with status "next", found 2');
    const u = goodTabs();
    u.Milestones[1].status = 'later';
    expect(msgs(assemble(u))).toContain('Milestones need "hvac": expected exactly one milestone with status "next", found 0');
  });

  it('reports an unknown source_id with tab and row', () => {
    const t = goodTabs(); t.Milestones[1].source_id = 'ghost';
    expect(msgs(assemble(t))).toContain('Milestones:3 unknown source_id "ghost"');
  });

  it('reports a bad enum value with tab and row', () => {
    const t = goodTabs(); t.Milestones[1].basis = 'guess';
    const r = assemble(t);
    expect(r.errors.some(e => e.tab === 'Milestones' && e.row === 3 && /basis/.test(e.message))).toBe(true);
  });

  it('live school with an unsourced claim is an error; draft school is a warning', () => {
    const t = goodTabs(); delete t.Needs[0].cost_source_id;
    const live = assemble(t);
    expect(live.errors.filter(e => /claim "cost" has no source/.test(e.message))).toHaveLength(1);
    t.Schools[0].status = 'draft';
    const draft = assemble(t);
    expect(draft.errors).toEqual([]);
    expect(draft.warnings.some(w => /claim "cost" has no source/.test(w.message))).toBe(true);
  });

  it('reports an invalid school status on its own row', () => {
    const t = goodTabs(); t.Schools[0].status = 'archived';
    const r = assemble(t);
    expect(r.errors.some(e => e.tab === 'Schools' && e.row === 2 && /status/.test(e.message))).toBe(true);
  });

  it('reports duplicate ids within a tab', () => {
    const t = goodTabs(); t.Sources.push({ ...t.Sources[0] });
    expect(msgs(assemble(t))).toContain('Sources:3 duplicate source_id "cip-2027"');
  });

  it('collects all problems instead of stopping at the first', () => {
    const t = goodTabs();
    t.Needs[0].track_id = 'nope'; t.Milestones[1].source_id = 'ghost';
    expect(assemble(t).errors.length).toBeGreaterThanOrEqual(2);
  });

  it('a blank row in a tab does not shift the spreadsheet row number of later rows', () => {
    const t = goodTabs();
    t.Milestones.splice(1, 0, {});
    t.Milestones[2].source_id = 'ghost';
    expect(msgs(assemble(t))).toContain('Milestones:4 unknown source_id "ghost"');
  });

  it('a bad field on a Needs row is reported against the Needs tab and row, not the Schools tab', () => {
    const t = goodTabs(); t.Needs[0].stage_basis = 'guess';
    const r = assemble(t);
    expect(r.errors.some(e => e.tab === 'Needs' && e.row === 2 && /stage_basis/.test(e.message))).toBe(true);
    expect(r.errors.some(e => e.tab === 'Schools')).toBe(false);
  });

  it('reports a need whose school does not exist', () => {
    const t = goodTabs(); t.Needs[0].school_id = 'ghost-school';
    expect(msgs(assemble(t))).toContain('Needs:2 need "hvac": unknown school_id "ghost-school"');
  });

  it('rows referencing an unknown need_id are reported under their own tab and row', () => {
    const t = goodTabs();
    t.Milestones[0].need_id = 'ghost';
    t.Engage[0].need_id = 'ghost';
    const m = msgs(assemble(t));
    expect(m).toContain('Milestones:2 unknown need_id "ghost"');
    expect(m).toContain('Engage:2 unknown need_id "ghost"');
  });
});
