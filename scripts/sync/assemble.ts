import { z } from 'astro/zod';
import type { Row, Problem } from './parse';
import { Track, School, Source, Stage, Milestone, Engage, Inquiry, Need, SchoolStatus, type TrackT, type SchoolT, type SourceT } from '../../src/schema/records';
import { unsourcedClaims } from '../../src/schema/claims';

export type { Problem };
export type TabName = 'Tracks' | 'Stages' | 'Schools' | 'Needs' | 'Milestones' | 'Engage' | 'Inquiries' | 'Sources';
export type Tabs = Record<TabName, Row[]>;

export const TAB_COLUMNS: Record<TabName, string[]> = {
  Tracks: ['track_id', 'name', 'description', 'routing_rule', 'policy_citation', 'verification', 'verified_by', 'verified_on'],
  Stages: ['stage_id', 'track_id', 'order', 'name', 'decider', 'venue', 'typical_duration', 'basis', 'source_id'],
  Schools: ['school_id', 'name', 'district', 'status', 'notes'],
  Needs: ['need_id', 'school_id', 'title', 'category', 'summary', 'track_id', 'current_stage_id', 'stage_basis', 'stage_source_id', 'cost', 'cost_basis', 'cost_source_id', 'window', 'window_basis', 'window_source_id'],
  Milestones: ['milestone_id', 'need_id', 'date', 'label', 'status', 'decider', 'venue', 'basis', 'source_id'],
  Engage: ['engage_id', 'need_id', 'venue', 'when', 'how', 'url', 'basis', 'source_id'],
  Inquiries: ['inquiry_id', 'need_id', 'date', 'to', 'question', 'response_date', 'response_summary', 'status', 'source_id'],
  Sources: ['source_id', 'title', 'publisher', 'url', 'retrieved_on', 'notes'],
};

const ID_COLUMN: Record<TabName, string> = {
  Tracks: 'track_id', Stages: 'stage_id', Schools: 'school_id', Needs: 'need_id',
  Milestones: 'milestone_id', Engage: 'engage_id', Inquiries: 'inquiry_id', Sources: 'source_id',
};

type Indexed = { row: number; data: Row };

function index(tab: TabName, rows: Row[], errors: Problem[]): Indexed[] {
  const seen = new Set<string>();
  const out: Indexed[] = [];
  rows.forEach((data, i) => {
    const rowNo = i + 2;
    if (Object.keys(data).length === 0) return; // blank-row placeholder; not an error, keeps later rows aligned
    const key = data[ID_COLUMN[tab]];
    if (!key) { errors.push({ tab, row: rowNo, message: `missing ${ID_COLUMN[tab]}` }); return; }
    if (seen.has(key)) { errors.push({ tab, row: rowNo, message: `duplicate ${ID_COLUMN[tab]} "${key}"` }); return; }
    seen.add(key);
    out.push({ row: rowNo, data });
  });
  return out;
}

/** Rename `<tab>_id` to `id`, drop foreign keys, coerce numeric columns. */
function toRecord(tab: TabName, data: Row, drop: string[] = []): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === ID_COLUMN[tab]) rec.id = v;
    else if (drop.includes(k)) continue;
    else if (k === 'order') rec.order = Number(v);
    else rec[k] = v;
  }
  return rec;
}

function validate<T>(schema: z.ZodType<T>, tab: TabName, row: number, rec: unknown, errors: Problem[]): T | undefined {
  const r = schema.safeParse(rec);
  if (r.success) return r.data;
  for (const issue of r.error.issues) errors.push({ tab, row, message: `${issue.path.join('.') || 'row'}: ${issue.message}` });
  return undefined;
}

// A Needs row's own scalar fields, validated per-row before the arrays (milestones/engage/
// inquiries) are attached — so a bad field (e.g. stage_basis) is reported against the Needs
// tab and row, not re-reported against the Schools tab/row when the assembled school is
// validated later.
const NeedBase = Need.omit({ milestones: true, engage: true, inquiries: true });

export function assemble(tabs: Tabs): { tracks: TrackT[]; schools: SchoolT[]; errors: Problem[]; warnings: Problem[] } {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];

  // Sources
  const sources = new Map<string, SourceT>();
  for (const { row, data } of index('Sources', tabs.Sources, errors)) {
    const s = validate(Source, 'Sources', row, toRecord('Sources', data), errors);
    if (s) sources.set(s.id, s);
  }
  const checkSource = (tab: TabName, row: number, ref: string | undefined) => {
    if (ref && !sources.has(ref)) errors.push({ tab, row, message: `unknown source_id "${ref}"` });
  };
  const collect = (ids: Array<string | undefined>): SourceT[] =>
    [...new Set(ids.filter((x): x is string => !!x))].filter(id => sources.has(id)).map(id => sources.get(id)!);

  // Stages grouped by track
  const stagesByTrack = new Map<string, Array<z.infer<typeof Stage>>>();
  const stageTrack = new Map<string, string>();
  for (const { row, data } of index('Stages', tabs.Stages, errors)) {
    checkSource('Stages', row, data.source_id);
    const s = validate(Stage, 'Stages', row, toRecord('Stages', data, ['track_id']), errors);
    if (!s) continue;
    if (!data.track_id) { errors.push({ tab: 'Stages', row, message: `stage "${s.id}": missing track_id` }); continue; }
    stageTrack.set(s.id, data.track_id);
    (stagesByTrack.get(data.track_id) ?? stagesByTrack.set(data.track_id, []).get(data.track_id)!).push(s);
  }

  // Tracks
  const tracks: TrackT[] = [];
  for (const { row, data } of index('Tracks', tabs.Tracks, errors)) {
    const stages = (stagesByTrack.get(data.track_id) ?? []).sort((a, b) => a.order - b.order);
    const rec = { ...toRecord('Tracks', data), stages, sources: collect(stages.map(s => s.source_id)) };
    const t = validate(Track, 'Tracks', row, rec, errors);
    if (t) tracks.push(t);
  }
  const trackIds = new Set(tracks.map(t => t.id));
  for (const [trackId] of stagesByTrack) {
    if (!trackIds.has(trackId)) errors.push({ tab: 'Stages', message: `stages reference unknown track_id "${trackId}"` });
  }

  // Needs: index first (before the child tabs) so Milestones/Engage/Inquiries rows can be
  // checked against the set of need_ids that actually survived indexing.
  const needEntries = index('Needs', tabs.Needs, errors);
  const needIds = new Set(needEntries.map(e => e.data.need_id));

  // Children of needs
  const byNeed = <T>(tab: TabName, schema: z.ZodType<T>): Map<string, T[]> => {
    const m = new Map<string, T[]>();
    for (const { row, data } of index(tab, tabs[tab], errors)) {
      if (!data.need_id) { errors.push({ tab, row, message: 'missing need_id' }); continue; }
      if (!needIds.has(data.need_id)) { errors.push({ tab, row, message: `unknown need_id "${data.need_id}"` }); continue; }
      checkSource(tab, row, data.source_id);
      const rec = validate(schema, tab, row, toRecord(tab, data, ['need_id']), errors);
      if (!rec) continue;
      (m.get(data.need_id) ?? m.set(data.need_id, []).get(data.need_id)!).push(rec);
    }
    return m;
  };
  const milestones = byNeed('Milestones', Milestone);
  const engage = byNeed('Engage', Engage);
  const inquiries = byNeed('Inquiries', Inquiry);

  // Needs grouped by school
  const needsBySchool = new Map<string, Array<Record<string, unknown>>>();
  const needRefsBySchool = new Map<string, Array<{ row: number; needId: string }>>();
  for (const { row, data } of needEntries) {
    const needId = data.need_id;
    if (!data.school_id) { errors.push({ tab: 'Needs', row, message: `need "${needId}": missing school_id` }); continue; }

    const validNeed = validate(NeedBase, 'Needs', row, toRecord('Needs', data, ['school_id']), errors);
    if (!validNeed) continue; // a malformed Needs row is reported here only, not re-reported via the Schools-level parse

    if (!trackIds.has(data.track_id ?? '')) errors.push({ tab: 'Needs', row, message: `need "${needId}": unknown track_id "${data.track_id}"` });
    else if (stageTrack.get(data.current_stage_id ?? '') !== data.track_id) {
      errors.push({ tab: 'Needs', row, message: `need "${needId}": current_stage_id "${data.current_stage_id}" is not a stage of track "${data.track_id}"` });
    }
    for (const col of ['stage_source_id', 'cost_source_id', 'window_source_id']) checkSource('Needs', row, data[col]);

    const ms = (milestones.get(needId) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    const nextCount = ms.filter(m => m.status === 'next').length;
    if (nextCount !== 1) errors.push({ tab: 'Milestones', message: `need "${needId}": expected exactly one milestone with status "next", found ${nextCount}` });

    const rec = {
      ...validNeed,
      milestones: ms,
      engage: engage.get(needId) ?? [],
      inquiries: (inquiries.get(needId) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
    };
    (needsBySchool.get(data.school_id) ?? needsBySchool.set(data.school_id, []).get(data.school_id)!).push(rec);
    (needRefsBySchool.get(data.school_id) ?? needRefsBySchool.set(data.school_id, []).get(data.school_id)!).push({ row, needId });
  }

  // Schools
  const schools: SchoolT[] = [];
  const schoolEntries = index('Schools', tabs.Schools, errors);
  const knownSchoolIds = new Set(schoolEntries.map(e => e.data.school_id));
  for (const { row, data } of schoolEntries) {
    const needs = needsBySchool.get(data.school_id) ?? [];
    const refs = needs.flatMap(n => [
      n.stage_source_id, n.cost_source_id, n.window_source_id,
      ...(n.milestones as Array<{ source_id?: string }>).map(x => x.source_id),
      ...(n.engage as Array<{ source_id?: string }>).map(x => x.source_id),
      ...(n.inquiries as Array<{ source_id?: string }>).map(x => x.source_id),
    ] as Array<string | undefined>);
    const rec = { ...toRecord('Schools', data), needs, sources: collect(refs) };
    // Validate as draft so referential-integrity errors (unknown source refs, etc.) surface
    // independently of the live-only unsourced-claims rule, which is enforced below by hand
    // so it is reported exactly once per claim instead of also being re-flagged by re-parsing
    // the school a second time at its real status.
    const draftCheck = School.safeParse({ ...rec, status: 'draft' });
    if (!draftCheck.success) {
      for (const issue of draftCheck.error.issues) errors.push({ tab: 'Schools', row, message: `${issue.path.join('.') || 'row'}: ${issue.message}` });
      continue;
    }
    for (const need of draftCheck.data.needs) {
      for (const c of unsourcedClaims(need)) {
        const p = { tab: 'Needs' as TabName, message: `school "${draftCheck.data.id}": need "${need.id}" claim "${c.label}" has no source` };
        (data.status === 'live' ? errors : warnings).push(p);
      }
    }
    const statusCheck = SchoolStatus.safeParse(data.status);
    if (!statusCheck.success) {
      errors.push({ tab: 'Schools', row, message: `status: ${statusCheck.error.issues[0]?.message ?? 'invalid status'}` });
      continue;
    }
    schools.push({ ...draftCheck.data, status: statusCheck.data });
  }

  // A Needs row can name a school_id that no School row has.
  for (const [schoolId, refs] of needRefsBySchool) {
    if (!knownSchoolIds.has(schoolId)) {
      for (const { row, needId } of refs) errors.push({ tab: 'Needs', row, message: `need "${needId}": unknown school_id "${schoolId}"` });
    }
  }

  // Dedupe exact-duplicate problems — e.g. a Needs row whose stage_source_id and
  // cost_source_id happen to name the same unknown source would otherwise report that
  // unknown source_id twice for the identical tab/row/message.
  const seen = new Set<string>();
  const dedupe = (ps: Problem[]) => ps.filter(p => { const k = `${p.tab}|${p.row ?? ''}|${p.message}`; if (seen.has(k)) return false; seen.add(k); return true; });

  return { tracks, schools, errors: dedupe(errors), warnings: dedupe(warnings) };
}
