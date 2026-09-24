import { z } from 'astro/zod';
import { unsourcedClaims } from './claims';

export const Basis = z.enum(['fact', 'requirement', 'estimate', 'interpretation']);
export const Verification = z.enum(['draft', 'documented', 'confirmed']);
export const MilestoneStatus = z.enum(['done', 'next', 'later']);
export const InquiryStatus = z.enum(['answered', 'partial', 'unanswered']);
export const SchoolStatus = z.enum(['live', 'draft']);

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase letters, digits, dashes');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dates are YYYY-MM-DD');
const text = z.string().min(1);

export const Source = z.object({
  id, title: text,
  publisher: text.optional(),
  url: z.string().url().optional(),
  retrieved_on: date.optional(),
  notes: text.optional(),
});

export const Stage = z.object({
  id, order: z.number().int().positive(), name: text, decider: text,
  venue: text.optional(), typical_duration: text.optional(),
  basis: Basis, source_id: id.optional(),
});

export const Track = z.object({
  id, name: text, description: text, routing_rule: text,
  policy_citation: text.optional(),
  verification: Verification,
  verified_by: text.optional(), verified_on: date.optional(),
  stages: z.array(Stage).min(1),
  sources: z.array(Source),
});

export const Milestone = z.object({
  id, date, label: text, status: MilestoneStatus,
  decider: text.optional(), venue: text.optional(),
  basis: Basis, source_id: id.optional(),
});

export const Engage = z.object({
  id, venue: text, when: text.optional(), how: text.optional(),
  url: z.string().url().optional(),
  basis: Basis, source_id: id.optional(),
});

export const Inquiry = z.object({
  id, date, to: text, question: text,
  response_date: date.optional(), response_summary: text.optional(),
  status: InquiryStatus, source_id: id.optional(),
});

export const Need = z.object({
  id, title: text, category: text.optional(), summary: text.optional(),
  track_id: id, current_stage_id: id,
  stage_basis: Basis, stage_source_id: id.optional(),
  cost: text.optional(), cost_basis: Basis.optional(), cost_source_id: id.optional(),
  window: text.optional(), window_basis: Basis.optional(), window_source_id: id.optional(),
  milestones: z.array(Milestone),
  engage: z.array(Engage),
  inquiries: z.array(Inquiry),
});

export const School = z.object({
  id, name: text, district: text, status: SchoolStatus, notes: text.optional(),
  needs: z.array(Need),
  sources: z.array(Source),
}).superRefine((school, ctx) => {
  const known = new Set(school.sources.map(s => s.id));
  for (const need of school.needs) {
    const refs: Array<[string, string | undefined]> = [
      ['stage_source_id', need.stage_source_id], ['cost_source_id', need.cost_source_id], ['window_source_id', need.window_source_id],
      ...need.milestones.map(m => [`milestone ${m.id}`, m.source_id] as [string, string | undefined]),
      ...need.engage.map(e => [`engage ${e.id}`, e.source_id] as [string, string | undefined]),
      ...need.inquiries.map(i => [`inquiry ${i.id}`, i.source_id] as [string, string | undefined]),
    ];
    for (const [where, ref] of refs) {
      if (ref && !known.has(ref)) ctx.addIssue({ code: 'custom', message: `need ${need.id}: ${where} references unknown source "${ref}"` });
    }
    if (school.status === 'live') {
      for (const c of unsourcedClaims(need)) {
        ctx.addIssue({ code: 'custom', message: `live school ${school.id}: need ${need.id} claim "${c.label}" has no source` });
      }
    }
  }
});

export type BasisT = z.infer<typeof Basis>;
export type SourceT = z.infer<typeof Source>;
export type StageT = z.infer<typeof Stage>;
export type TrackT = z.infer<typeof Track>;
export type MilestoneT = z.infer<typeof Milestone>;
export type EngageT = z.infer<typeof Engage>;
export type InquiryT = z.infer<typeof Inquiry>;
export type NeedT = z.infer<typeof Need>;
export type SchoolT = z.infer<typeof School>;
