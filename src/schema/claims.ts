import type { NeedT, BasisT } from './records';

export type Claim = { need_id: string; label: string; basis: BasisT; source_id?: string };

export function claimsOf(need: NeedT): Claim[] {
  const out: Claim[] = [
    { need_id: need.id, label: 'stage', basis: need.stage_basis, source_id: need.stage_source_id },
  ];
  if (need.cost !== undefined) {
    out.push({ need_id: need.id, label: 'cost', basis: need.cost_basis ?? 'interpretation', source_id: need.cost_source_id });
  }
  if (need.window !== undefined) {
    out.push({ need_id: need.id, label: 'window', basis: need.window_basis ?? 'interpretation', source_id: need.window_source_id });
  }
  if (need.why_track !== undefined) {
    out.push({ need_id: need.id, label: 'why_track', basis: need.why_track_basis ?? 'interpretation', source_id: need.why_track_source_id });
  }
  for (const f of need.funding ?? []) out.push({ need_id: need.id, label: `funding:${f.id}`, basis: f.basis, source_id: f.source_id });
  for (const m of need.milestones) out.push({ need_id: need.id, label: `milestone:${m.id}`, basis: m.basis, source_id: m.source_id });
  for (const e of need.engage) out.push({ need_id: need.id, label: `engage:${e.id}`, basis: e.basis, source_id: e.source_id });
  return out;
}

export function unsourcedClaims(need: NeedT): Claim[] {
  return claimsOf(need).filter(c => !c.source_id);
}
