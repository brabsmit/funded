# FundED Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Astro site on GitHub Pages that shows, for each facility need at a school, what stage it is at, who decides next, and where to engage, with every claim labeled by basis and source, fed by a Google Sheet through a validating sync script.

**Architecture:** Sheet tabs → CSV files in `data/sheet/` → `scripts/sync` validates against Zod schemas and writes denormalized JSON into `src/content/` → Astro content collections (same schemas) render four static routes. The DRAFT stamp is driven by the tracks' `verification` field. A live school fails the build if any claim is unsourced.

**Tech Stack:** Astro 7, TypeScript strict, Tailwind 4 (`@tailwindcss/vite`), Zod via `astro/zod`, papaparse, tsx, Vitest 5, Playwright, GitHub Pages via `withastro/action@v6`.

**Spec:** `docs/superpowers/specs/2026-09-24-funded-explorer-design.md`

## Global Constraints

- Repo: `~/code/active/funded`, public GitHub repo `brabsmit/funded`, site `https://brabsmit.github.io`, base `/funded`.
- No backend, no auth, no paid services, no runtime data fetching. Zero client JavaScript (native `popover` for tooltips).
- Data files under `src/content/` are written only by `scripts/sync`; never hand-edited.
- All IDs: lowercase letters, digits, dashes (`/^[a-z0-9][a-z0-9-]*$/`). All dates: `YYYY-MM-DD`.
- Enums exactly as spec: `basis` ∈ fact | requirement | estimate | interpretation; `verification` ∈ draft | documented | confirmed; milestone `status` ∈ done | next | later; inquiry `status` ∈ answered | partial | unanswered; school `status` ∈ live | draft.
- Sheet tab names, exactly: `Tracks`, `Stages`, `Schools`, `Needs`, `Milestones`, `Engage`, `Inquiries`, `Sources`, `Legend`.
- Every internal link is built with `href()` from `src/lib/url.ts` so the `/funded` base works.
- Base type size 20px on `html` (about one-third larger than a normal site) for filming legibility.
- Commit after every task with the attribution trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

Inputs the spec implies but that need a pinned test, most likely to bite first:

1. **A sheet cell containing a comma or a newline** (e.g. a milestone label "Design, bid, and award"). Expected: parsed as one field, not split. → Task 3 `parse.test.ts` "quoted field with comma and newline round-trips".
2. **A `next` milestone missing, or two `next` milestones on one need.** Expected: sync reports an error naming the need; the page never renders two "next" cards. → Task 3 `assemble.test.ts` "exactly one next milestone per need".
3. **A `current_stage_id` that exists but belongs to a different track.** Expected: error, not a silently wrong pipeline. → Task 3 `assemble.test.ts` "current stage must belong to the need's track".
4. **A trailing slash or missing slash on `BASE_URL`.** Expected: `href('/schools/oakridge/')` yields exactly `/funded/schools/oakridge/` either way. → Task 6 `url.test.ts`.
5. **Blank rows and stray whitespace in the sheet** (someone hits Enter below the last row, or types `fact ` with a trailing space). Expected: blank rows ignored; values trimmed before enum validation. → Task 3 `parse.test.ts` "blank rows dropped and values trimmed".

---

### Task 1: Project scaffold, Tailwind, Pages deploy workflow

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`, `README.md`
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `Base.astro` with props `{ title: string; description?: string }` and a default slot. `global.css` with the `@theme` tokens below. npm scripts `dev`, `build`, `preview`, `check`, `test`, `sync`, `sync:local`, `e2e`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "funded",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "sync": "tsx scripts/sync/index.ts --remote",
    "sync:local": "tsx scripts/sync/index.ts",
    "e2e": "playwright test"
  },
  "dependencies": {
    "astro": "^7.3.5",
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.10",
    "@playwright/test": "^1.63.0",
    "@types/node": "^22.0.0",
    "@types/papaparse": "^5.3.14",
    "papaparse": "^5.7.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^5.0.1"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.nvmrc`**

`astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brabsmit.github.io',
  base: '/funded',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "types": ["node"]
  }
}
```

`.gitignore`:
```
node_modules/
dist/
.astro/
e2e/screenshots/
test-results/
playwright-report/
.DS_Store
```

`.nvmrc`:
```
22
```

- [ ] **Step 3: Write `src/styles/global.css`**

```css
@import "tailwindcss";

@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-serif: "Iowan Old Style", "Palatino Linotype", Georgia, serif;

  --color-ink: #1a1d21;
  --color-ink-muted: #5b6470;
  --color-paper: #fbfaf7;
  --color-line: #d9d6cf;
  --color-accent: #1f5f8b;
  --color-accent-soft: #e3eef7;
  --color-done: #2e7d4f;
  --color-later: #9aa3ad;
  --color-draft: #b4541a;
  --color-draft-soft: #fbe9dc;
  --color-warn: #8a6d00;
}

html { font-size: 20px; background: var(--color-paper); color: var(--color-ink); }
body { font-family: var(--font-sans); font-variant-numeric: tabular-nums; }
h1, h2, h3 { font-family: var(--font-serif); letter-spacing: -0.01em; }

.chip {
  @apply inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] uppercase tracking-wide;
  border-color: var(--color-line);
  color: var(--color-ink-muted);
  background: white;
}
.chip-unsourced { border-style: dashed; color: var(--color-warn); }

.stamp {
  @apply inline-block rotate-[-3deg] rounded border-4 px-3 py-1 font-bold uppercase tracking-widest;
  color: var(--color-draft);
  border-color: var(--color-draft);
  background: var(--color-draft-soft);
}
```

- [ ] **Step 4: Write `src/layouts/Base.astro` and a placeholder `src/pages/index.astro`**

`src/layouts/Base.astro`:
```astro
---
import "../styles/global.css";
interface Props { title: string; description?: string }
const { title, description = "Where a school facility need stands, who decides next, and where to engage." } = Astro.props;
const base = import.meta.env.BASE_URL.replace(/\/+$/, '') + '/';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title} · FundED</title>
    <meta name="description" content={description} />
  </head>
  <body class="min-h-screen">
    <header class="border-b border-line">
      <nav class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href={base} class="font-serif text-xl font-semibold">FundED</a>
        <div class="flex gap-5 text-sm text-ink-muted">
          <a href={`${base}tracks/`}>How it works</a>
          <a href={`${base}roadmap/`}>Roadmap</a>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-8">
      <slot />
    </main>
    <footer class="mx-auto max-w-5xl px-4 py-10 text-sm text-ink-muted">
      FundED · Arlington Public Schools pilot · An EMBA Ethics Project, Georgetown McDonough, Fall 2026.
    </footer>
  </body>
</html>
```

`src/pages/index.astro` (placeholder, replaced in Task 6):
```astro
---
import Base from "../layouts/Base.astro";
---
<Base title="Check a school's status">
  <h1 class="text-3xl">FundED</h1>
  <p class="mt-2 text-ink-muted">Scaffold. Replaced in Task 6.</p>
</Base>
```

- [ ] **Step 5: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 6: Write `README.md`**

```markdown
# FundED Explorer

Where a school facility need stands, who decides the next step, and where to engage.
Arlington Public Schools pilot. Georgetown EMBA Ethics Project, Fall 2026.

Live: https://brabsmit.github.io/funded/

## How data flows

Google Sheet (source of truth, edited by the team)
→ `npm run sync` downloads each tab as CSV into `data/sheet/`
→ validates against `src/schema/records.ts`
→ writes `src/content/tracks/*.json` and `src/content/schools/*.json`
→ `npm run build` renders the site.

`src/content/**` is generated. Never edit it by hand.

## Commands

| Command | What |
|---|---|
| `npm run dev` | local dev server |
| `npm run build` | production build to `dist/` |
| `npm run sync` | fetch the published Sheet, validate, write content |
| `npm run sync:local` | same, from the CSVs already in `data/sheet/` |
| `npm test` | unit tests |
| `npm run e2e` | Playwright screenshots of the recording path |

## Connecting the Sheet

See Task 10 section in `docs/superpowers/plans/2026-09-24-funded-explorer.md` until this README is finished in that task.
```

- [ ] **Step 7: Install and build**

Run: `cd ~/code/active/funded && npm install && npm run build`
Expected: `dist/index.html` exists; build output shows 1 page. Then `npm run check` → 0 errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Scaffold Astro site with Tailwind and Pages deploy workflow

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Zod schemas and the claims rule

**Files:**
- Create: `src/schema/claims.ts`, `src/schema/records.ts`, `vitest.config.ts`
- Test: `tests/schema/records.test.ts`

**Interfaces:**
- Produces (from `records.ts`): Zod schemas `Source`, `Stage`, `Track`, `Milestone`, `Engage`, `Inquiry`, `Need`, `School`; enums `Basis`, `Verification`, `MilestoneStatus`, `InquiryStatus`, `SchoolStatus`; inferred types of the same names via `z.infer` exported as `type SourceT`, `type StageT`, `type TrackT`, `type MilestoneT`, `type EngageT`, `type InquiryT`, `type NeedT`, `type SchoolT`.
- Produces (from `claims.ts`): `type Claim = { need_id: string; label: string; basis: BasisT; source_id?: string }`, `claimsOf(need: NeedT): Claim[]`, `unsourcedClaims(need: NeedT): Claim[]`.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write the failing tests**

`tests/schema/records.test.ts`:
```ts
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `../../src/schema/records`.

- [ ] **Step 4: Write `src/schema/claims.ts`**

```ts
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
  for (const m of need.milestones) out.push({ need_id: need.id, label: `milestone:${m.id}`, basis: m.basis, source_id: m.source_id });
  for (const e of need.engage) out.push({ need_id: need.id, label: `engage:${e.id}`, basis: e.basis, source_id: e.source_id });
  return out;
}

export function unsourcedClaims(need: NeedT): Claim[] {
  return claimsOf(need).filter(c => !c.source_id);
}
```

- [ ] **Step 5: Write `src/schema/records.ts`**

```ts
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
```

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: all tests in `tests/schema/records.test.ts` PASS.

- [ ] **Step 7: Commit**

```bash
git add src/schema tests/schema vitest.config.ts
git commit -m "Add record schemas with claim enumeration and live-school source rule

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Sync parse and assemble with referential integrity

**Files:**
- Create: `scripts/sync/parse.ts`, `scripts/sync/assemble.ts`
- Test: `tests/sync/parse.test.ts`, `tests/sync/assemble.test.ts`, `tests/sync/fixtures.ts`

**Interfaces:**
- Consumes: schemas and types from Task 2.
- Produces (`parse.ts`): `type Row = Record<string, string>` (blank cells omitted, values trimmed); `parseTab(csv: string): Row[]`; `requireColumns(tab: string, rows: Row[], header: string[], required: string[]): Problem[]`; `parseHeader(csv: string): string[]`.
- Produces (`assemble.ts`): `type Problem = { tab: string; row?: number; message: string }`; `type Tabs = Record<'Tracks'|'Stages'|'Schools'|'Needs'|'Milestones'|'Engage'|'Inquiries'|'Sources', Row[]>`; `assemble(tabs: Tabs): { tracks: TrackT[]; schools: SchoolT[]; errors: Problem[]; warnings: Problem[] }`; `TAB_COLUMNS: Record<keyof Tabs, string[]>` (required column names per tab).

Row numbers in Problems are spreadsheet row numbers: header is row 1, first data row is row 2.

- [ ] **Step 1: Write the fixtures helper**

`tests/sync/fixtures.ts`:
```ts
import type { Tabs } from '../../scripts/sync/assemble';

export function goodTabs(): Tabs {
  return {
    Tracks: [
      { track_id: 'cip', name: 'Capital (CIP)', description: 'Bond-funded capital projects', routing_rule: 'Major renovations and new construction', policy_citation: 'CIP FY2027-36', verification: 'draft' },
    ],
    Stages: [
      { stage_id: 'cip-plan', track_id: 'cip', order: '1', name: 'In the CIP', decider: 'School Board', venue: 'CIP adoption', basis: 'requirement', source_id: 'cip-2027' },
      { stage_id: 'cip-funding', track_id: 'cip', order: '2', name: 'Bond funding', decider: 'Voters', venue: 'Bond referendum', basis: 'requirement', source_id: 'cip-2027' },
      { stage_id: 'cip-design', track_id: 'cip', order: '3', name: 'Design', decider: 'Facilities & Operations', basis: 'requirement', source_id: 'cip-2027' },
    ],
    Schools: [
      { school_id: 'oakridge', name: 'Oakridge Elementary', district: 'Arlington Public Schools', status: 'live' },
    ],
    Needs: [
      { need_id: 'hvac', school_id: 'oakridge', title: 'HVAC replacement', track_id: 'cip', current_stage_id: 'cip-funding', stage_basis: 'fact', stage_source_id: 'cip-2027', cost: '$31M', cost_basis: 'estimate', cost_source_id: 'cip-2027', window: 'Summer 2027-2029', window_basis: 'estimate', window_source_id: 'cip-2027' },
    ],
    Milestones: [
      { milestone_id: 'cip-adopted', need_id: 'hvac', date: '2026-06-18', label: 'CIP adopted', status: 'done', decider: 'School Board', basis: 'fact', source_id: 'cip-2027' },
      { milestone_id: 'bond', need_id: 'hvac', date: '2026-11-03', label: 'Bond referendum', status: 'next', decider: 'Voters', basis: 'fact', source_id: 'cip-2027' },
    ],
    Engage: [
      { engage_id: 'board', need_id: 'hvac', venue: 'School Board meeting', when: 'Twice monthly', how: 'Sign up for public comment', url: 'https://www.apsva.us/school-board-meetings/', basis: 'fact', source_id: 'cip-2027' },
    ],
    Inquiries: [
      { inquiry_id: 'apr-email', need_id: 'hvac', date: '2026-04-15', to: 'Superintendent', question: 'What is the plan for the next two months?', response_date: '2026-04-16', response_summary: 'Copied the principal to monitor.', status: 'partial' },
    ],
    Sources: [
      { source_id: 'cip-2027', title: 'APS CIP FY2027-2036', publisher: 'Arlington Public Schools', url: 'https://www.apsva.us/cip', retrieved_on: '2026-09-24' },
    ],
  };
}
```

- [ ] **Step 2: Write the failing parse tests**

`tests/sync/parse.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseTab, parseHeader, requireColumns } from '../../scripts/sync/parse';

describe('parseTab', () => {
  it('quoted field with comma and newline round-trips', () => {
    const csv = 'a,b\n"Design, bid, and award","line one\nline two"\n';
    expect(parseTab(csv)).toEqual([{ a: 'Design, bid, and award', b: 'line one\nline two' }]);
  });
  it('blank rows dropped and values trimmed', () => {
    const csv = 'basis,label\n fact ,Bond vote\n,\n\n  ,  \n';
    expect(parseTab(csv)).toEqual([{ basis: 'fact', label: 'Bond vote' }]);
  });
  it('omits empty cells instead of returning empty strings', () => {
    expect(parseTab('a,b,c\n1,,3\n')).toEqual([{ a: '1', c: '3' }]);
  });
  it('parseHeader returns trimmed header names', () => {
    expect(parseHeader(' a , b\n1,2\n')).toEqual(['a', 'b']);
  });
});

describe('requireColumns', () => {
  it('reports each missing column once with the tab name', () => {
    const problems = requireColumns('Needs', [], ['need_id', 'title'], ['need_id', 'title', 'track_id', 'school_id']);
    expect(problems).toEqual([
      { tab: 'Needs', message: 'missing column "track_id"' },
      { tab: 'Needs', message: 'missing column "school_id"' },
    ]);
  });
});
```

- [ ] **Step 3: Run parse tests to verify they fail**

Run: `npm test -- tests/sync/parse.test.ts`
Expected: FAIL, cannot resolve `scripts/sync/parse`.

- [ ] **Step 4: Write `scripts/sync/parse.ts`**

```ts
import Papa from 'papaparse';

export type Row = Record<string, string>;
export type Problem = { tab: string; row?: number; message: string };

export function parseHeader(csv: string): string[] {
  const first = Papa.parse<string[]>(csv, { preview: 1, skipEmptyLines: true }).data[0] ?? [];
  return first.map(h => h.trim());
}

export function parseTab(csv: string): Row[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  });
  const rows: Row[] = [];
  for (const raw of result.data) {
    const row: Row = {};
    for (const [k, v] of Object.entries(raw)) if (k && v !== '') row[k] = v;
    if (Object.keys(row).length > 0) rows.push(row);
  }
  return rows;
}

export function requireColumns(tab: string, _rows: Row[], header: string[], required: string[]): Problem[] {
  return required.filter(c => !header.includes(c)).map(c => ({ tab, message: `missing column "${c}"` }));
}
```

- [ ] **Step 5: Run parse tests**

Run: `npm test -- tests/sync/parse.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing assemble tests**

`tests/sync/assemble.test.ts`:
```ts
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
    expect(live.errors.some(e => /claim "cost" has no source/.test(e.message))).toBe(true);
    t.Schools[0].status = 'draft';
    const draft = assemble(t);
    expect(draft.errors).toEqual([]);
    expect(draft.warnings.some(w => /claim "cost" has no source/.test(w.message))).toBe(true);
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
});
```

- [ ] **Step 7: Run assemble tests to verify they fail**

Run: `npm test -- tests/sync/assemble.test.ts`
Expected: FAIL, cannot resolve `scripts/sync/assemble`.

- [ ] **Step 8: Write `scripts/sync/assemble.ts`**

```ts
import { z } from 'astro/zod';
import type { Row, Problem } from './parse';
import { Track, School, Source, Stage, Milestone, Engage, Inquiry, type TrackT, type SchoolT, type SourceT } from '../../src/schema/records';
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

  // Children of needs
  const byNeed = <T>(tab: TabName, schema: z.ZodType<T>): Map<string, T[]> => {
    const m = new Map<string, T[]>();
    for (const { row, data } of index(tab, tabs[tab], errors)) {
      checkSource(tab, row, data.source_id);
      const rec = validate(schema, tab, row, toRecord(tab, data, ['need_id']), errors);
      if (!rec) continue;
      if (!data.need_id) { errors.push({ tab, row, message: 'missing need_id' }); continue; }
      (m.get(data.need_id) ?? m.set(data.need_id, []).get(data.need_id)!).push(rec);
    }
    return m;
  };
  const milestones = byNeed('Milestones', Milestone);
  const engage = byNeed('Engage', Engage);
  const inquiries = byNeed('Inquiries', Inquiry);

  // Needs grouped by school
  const needsBySchool = new Map<string, Array<Record<string, unknown>>>();
  for (const { row, data } of index('Needs', tabs.Needs, errors)) {
    const needId = data.need_id;
    if (!data.school_id) { errors.push({ tab: 'Needs', row, message: `need "${needId}": missing school_id` }); continue; }
    if (!trackIds.has(data.track_id ?? '')) errors.push({ tab: 'Needs', row, message: `need "${needId}": unknown track_id "${data.track_id}"` });
    else if (stageTrack.get(data.current_stage_id ?? '') !== data.track_id) {
      errors.push({ tab: 'Needs', row, message: `need "${needId}": current_stage_id "${data.current_stage_id}" is not a stage of track "${data.track_id}"` });
    }
    for (const col of ['stage_source_id', 'cost_source_id', 'window_source_id']) checkSource('Needs', row, data[col]);

    const ms = (milestones.get(needId) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    const nextCount = ms.filter(m => m.status === 'next').length;
    if (nextCount !== 1) errors.push({ tab: 'Milestones', message: `need "${needId}": expected exactly one milestone with status "next", found ${nextCount}` });

    const rec = {
      ...toRecord('Needs', data, ['school_id']),
      milestones: ms,
      engage: engage.get(needId) ?? [],
      inquiries: (inquiries.get(needId) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
    };
    (needsBySchool.get(data.school_id) ?? needsBySchool.set(data.school_id, []).get(data.school_id)!).push(rec);
  }
  for (const m of [milestones, engage, inquiries]) {
    for (const needId of m.keys()) {
      if (!tabs.Needs.some(n => n.need_id === needId)) errors.push({ tab: 'Needs', message: `rows reference unknown need_id "${needId}"` });
    }
  }

  // Schools
  const schools: SchoolT[] = [];
  for (const { row, data } of index('Schools', tabs.Schools, errors)) {
    const needs = needsBySchool.get(data.school_id) ?? [];
    const refs = needs.flatMap(n => [
      n.stage_source_id, n.cost_source_id, n.window_source_id,
      ...(n.milestones as Array<{ source_id?: string }>).map(x => x.source_id),
      ...(n.engage as Array<{ source_id?: string }>).map(x => x.source_id),
      ...(n.inquiries as Array<{ source_id?: string }>).map(x => x.source_id),
    ] as Array<string | undefined>);
    const rec = { ...toRecord('Schools', data), needs, sources: collect(refs) };
    // Validate as draft first so integrity errors surface separately from the live rule.
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
    const s = validate(School, 'Schools', row, rec, errors);
    if (s) schools.push(s);
  }

  // Dedupe error messages produced by both the manual live rule and the schema refine.
  const seen = new Set<string>();
  const dedupe = (ps: Problem[]) => ps.filter(p => { const k = `${p.tab}|${p.row ?? ''}|${p.message}`; if (seen.has(k)) return false; seen.add(k); return true; });

  return { tracks, schools, errors: dedupe(errors), warnings: dedupe(warnings) };
}
```

- [ ] **Step 9: Run assemble tests**

Run: `npm test -- tests/sync/assemble.test.ts`
Expected: PASS. If the live-school test sees two similar messages (one from the manual loop, one from the schema refine), the dedupe only removes exact duplicates; the test uses regex `some(...)` so both forms are acceptable. If `Needs:2 need "hvac": unknown track_id "nope"` does not match exactly, fix the message string, not the test.

- [ ] **Step 10: Commit**

```bash
git add scripts/sync/parse.ts scripts/sync/assemble.ts tests/sync
git commit -m "Add sync parse and assemble with referential integrity checks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Sync fetch, write, and CLI

**Files:**
- Create: `scripts/sync/fetch.ts`, `scripts/sync/write.ts`, `scripts/sync/index.ts`, `sync.config.json`, `data/sheet/.gitkeep`
- Test: `tests/sync/write.test.ts`

**Interfaces:**
- Consumes: `parseTab`, `parseHeader`, `requireColumns` (Task 3); `assemble`, `TAB_COLUMNS`, `Tabs`, `TabName` (Task 3).
- Produces (`fetch.ts`): `type SyncConfig = { publishedCsvBase: string; gids: Record<TabName, number> }`; `readLocalTabs(dir: string): Promise<Record<TabName, string>>`; `fetchRemoteTabs(cfg: SyncConfig): Promise<Record<TabName, string>>`; `TAB_NAMES: TabName[]`.
- Produces (`write.ts`): `writeContent(root: string, tracks: TrackT[], schools: SchoolT[]): Promise<string[]>` returning written paths; removes stale `*.json` in `src/content/tracks` and `src/content/schools` first.

- [ ] **Step 1: Write `sync.config.json` and `data/sheet/.gitkeep`**

`sync.config.json`:
```json
{
  "publishedCsvBase": "",
  "gids": {
    "Tracks": 0, "Stages": 0, "Schools": 0, "Needs": 0,
    "Milestones": 0, "Engage": 0, "Inquiries": 0, "Sources": 0
  },
  "_how": "File > Share > Publish to web > Entire document as CSV. Paste the URL up to and including /pub into publishedCsvBase. Each tab's gid is the number after #gid= in the browser URL when that tab is selected."
}
```

Run: `mkdir -p data/sheet && touch data/sheet/.gitkeep`

- [ ] **Step 2: Write the failing write test**

`tests/sync/write.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeContent } from '../../scripts/sync/write';
import { assemble } from '../../scripts/sync/assemble';
import { goodTabs } from './fixtures';

describe('writeContent', () => {
  it('writes one JSON per track and school and removes stale files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'funded-'));
    await mkdir(join(root, 'src/content/schools'), { recursive: true });
    await writeFile(join(root, 'src/content/schools/stale.json'), '{}');
    const { tracks, schools } = assemble(goodTabs());
    const written = await writeContent(root, tracks, schools);
    expect(written.map(p => p.replace(root, ''))).toEqual(['/src/content/tracks/cip.json', '/src/content/schools/oakridge.json']);
    expect(await readdir(join(root, 'src/content/schools'))).toEqual(['oakridge.json']);
    const school = JSON.parse(await readFile(join(root, 'src/content/schools/oakridge.json'), 'utf8'));
    expect(school.needs[0].milestones[1].status).toBe('next');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- tests/sync/write.test.ts`
Expected: FAIL, cannot resolve `scripts/sync/write`.

- [ ] **Step 4: Write `scripts/sync/write.ts`**

```ts
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TrackT, SchoolT } from '../../src/schema/records';

async function resetDir(dir: string) {
  await mkdir(dir, { recursive: true });
  for (const f of await readdir(dir)) if (f.endsWith('.json')) await rm(join(dir, f));
}

export async function writeContent(root: string, tracks: TrackT[], schools: SchoolT[]): Promise<string[]> {
  const tracksDir = join(root, 'src/content/tracks');
  const schoolsDir = join(root, 'src/content/schools');
  await resetDir(tracksDir);
  await resetDir(schoolsDir);
  const written: string[] = [];
  for (const t of tracks) {
    const p = join(tracksDir, `${t.id}.json`);
    await writeFile(p, JSON.stringify(t, null, 2) + '\n');
    written.push(p);
  }
  for (const s of schools) {
    const p = join(schoolsDir, `${s.id}.json`);
    await writeFile(p, JSON.stringify(s, null, 2) + '\n');
    written.push(p);
  }
  return written;
}
```

- [ ] **Step 5: Run the write test**

Run: `npm test -- tests/sync/write.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `scripts/sync/fetch.ts`**

```ts
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TabName } from './assemble';

export const TAB_NAMES: TabName[] = ['Tracks', 'Stages', 'Schools', 'Needs', 'Milestones', 'Engage', 'Inquiries', 'Sources'];
export type SyncConfig = { publishedCsvBase: string; gids: Record<TabName, number> };

export async function readLocalTabs(dir: string): Promise<Record<TabName, string>> {
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) out[tab] = await readFile(join(dir, `${tab}.csv`), 'utf8');
  return out;
}

export async function fetchRemoteTabs(cfg: SyncConfig, saveDir?: string): Promise<Record<TabName, string>> {
  if (!cfg.publishedCsvBase) throw new Error('sync.config.json: publishedCsvBase is empty. Publish the Sheet to the web first, or run npm run sync:local.');
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) {
    const url = `${cfg.publishedCsvBase}?gid=${cfg.gids[tab]}&single=true&output=csv`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${tab}: HTTP ${res.status} fetching ${url}`);
    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error(`${tab}: got HTML instead of CSV. Is the sheet published to the web and is gid ${cfg.gids[tab]} correct?`);
    out[tab] = text;
    if (saveDir) await writeFile(join(saveDir, `${tab}.csv`), text);
  }
  return out;
}
```

- [ ] **Step 7: Write `scripts/sync/index.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseTab, parseHeader, requireColumns, type Problem } from './parse';
import { assemble, TAB_COLUMNS, type Tabs, type TabName } from './assemble';
import { readLocalTabs, fetchRemoteTabs, TAB_NAMES, type SyncConfig } from './fetch';
import { writeContent } from './write';

const root = resolve(import.meta.dirname, '../..');
const sheetDir = resolve(root, 'data/sheet');
const remote = process.argv.includes('--remote');

function print(label: string, problems: Problem[]) {
  if (problems.length === 0) return;
  console.log(`\n${label} (${problems.length}):`);
  for (const p of problems) console.log(`  ${p.tab}${p.row ? ` row ${p.row}` : ''}: ${p.message}`);
}

async function main() {
  let raw: Record<TabName, string>;
  if (remote) {
    const cfg = JSON.parse(await readFile(resolve(root, 'sync.config.json'), 'utf8')) as SyncConfig;
    raw = await fetchRemoteTabs(cfg, sheetDir);
    console.log(`Fetched ${TAB_NAMES.length} tabs into data/sheet/`);
  } else {
    raw = await readLocalTabs(sheetDir);
    console.log(`Read ${TAB_NAMES.length} tabs from data/sheet/`);
  }

  const errors: Problem[] = [];
  const tabs = {} as Tabs;
  for (const tab of TAB_NAMES) {
    errors.push(...requireColumns(tab, [], parseHeader(raw[tab]), TAB_COLUMNS[tab]));
    tabs[tab] = parseTab(raw[tab]);
  }
  if (errors.length) { print('Errors', errors); process.exit(1); }

  const result = assemble(tabs);
  print('Warnings', result.warnings);
  if (result.errors.length) { print('Errors', result.errors); console.log('\nNothing written.'); process.exit(1); }

  const written = await writeContent(root, result.tracks, result.schools);
  console.log(`\nWrote ${written.length} files:`);
  for (const p of written) console.log(`  ${p.replace(root + '/', '')}`);
  console.log('\nReview with: git diff --stat src/content');
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
```

- [ ] **Step 8: Smoke-test the CLI against a temporary sheet made from the fixture**

Write `scripts/dev/fixture-to-csv.ts`:
```ts
import Papa from 'papaparse';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { goodTabs } from '../../tests/sync/fixtures';
import { TAB_COLUMNS, type TabName } from '../sync/assemble';

const dir = resolve(import.meta.dirname, '../../data/sheet');
for (const [tab, rows] of Object.entries(goodTabs()) as Array<[TabName, Record<string, string>[]]>) {
  writeFileSync(resolve(dir, `${tab}.csv`), Papa.unparse(rows, { columns: TAB_COLUMNS[tab] }) + '\n');
}
console.log('wrote fixture CSVs to data/sheet/');
```

Run:
```bash
npx tsx scripts/dev/fixture-to-csv.ts
npm run sync:local && git status --short src/content
```
Expected: "Wrote 2 files", `src/content/tracks/cip.json` and `src/content/schools/oakridge.json` appear. Then `npm run sync` (remote) should fail with the "publishedCsvBase is empty" message and a non-zero exit.

- [ ] **Step 9: Commit**

```bash
git add scripts/sync scripts/dev sync.config.json data/sheet src/content tests/sync/write.test.ts
git commit -m "Add sync CLI with local and published-sheet modes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Oakridge source research and real data rows

This task produces data, not code. Its output replaces the fixture CSVs in `data/sheet/` with real rows. It can run in parallel with Tasks 6 to 9.

**Files:**
- Modify: `data/sheet/Tracks.csv`, `Stages.csv`, `Schools.csv`, `Needs.csv`, `Milestones.csv`, `Engage.csv`, `Inquiries.csv`, `Sources.csv`
- Regenerate: `src/content/**` via `npm run sync:local`

**Interfaces:**
- Consumes: column lists in `TAB_COLUMNS` (Task 3).
- Produces: a `draft` or `live` Oakridge school record and three tracks (`cip`, `mcmm`, `gift`) that pass `npm run sync:local`.

- [ ] **Step 1: Find primary sources. For each, record title, publisher, URL, and today's date.**

Search Arlington Public Schools (apsva.us) and Arlington County (arlingtonva.us) for:
1. The adopted CIP that covers FY2027 (look for "FY 2027-2036 CIP" or "FY 2027-36 Capital Improvement Plan", School Board adoption in June 2026) and the Oakridge Elementary entry: project scope, cost, schedule. Note the exact cost and window as printed.
2. The School Board resolution or County Board action placing school bonds on the **November 3, 2026** ballot, with the bond amount.
3. **School Board Policy D-15** (gifts, grants, donations) and its Policy Implementation Procedure: who accepts a gift at each dollar level (principal / Operations / Superintendent / Board).
4. The APS definition of **Major Construction / Minor Maintenance (MC/MM)** or "minor capital", including the cost cutoff that separates it from CIP, and who approves.
5. School Board meeting calendar page (for Engage), CCPTA page (for Engage), and the Sep 24 2026 meeting / Sep 29 2026 work session agenda if posted.

Use WebSearch, then WebFetch on the APS page to confirm the text. Do not cite a search-result snippet; cite the page you fetched.

- [ ] **Step 2: Write `Sources.csv`**

One row per document found. `source_id` examples: `cip-fy27-36`, `bond-2026-resolution`, `policy-d15`, `policy-d15-pip`, `mcmm-definition`, `board-calendar`, `ccpta`, `email-2026-04`. The email source row: title "Email exchange with Superintendent, April 15-16 2026", publisher "Provided by team member (personal correspondence)", no URL, notes "Original held by the team; quoted in the pitch video."

- [ ] **Step 3: Write `Tracks.csv` and `Stages.csv`**

Three tracks with `verification: draft` unless a document fully specifies the stage (then `documented`). Stages, minimum:
- `cip`: `cip-plan` (In the CIP, decider School Board, venue CIP adoption) → `cip-funding` (Bond funding, decider Voters, venue Bond referendum) → `cip-design` (Design, decider Facilities & Operations) → `cip-bid` (Procurement, decider Facilities & Operations / Purchasing) → `cip-build` (Construction, decider Contractor under APS management) → `cip-done` (Commissioning).
- `mcmm`: `mcmm-request` (Request, decider Principal / Facilities) → `mcmm-priority` (Prioritized in annual MC/MM list, decider Facilities & Operations) → `mcmm-budget` (Funded in operating/minor capital budget, decider School Board) → `mcmm-work` (Work order executed).
- `gift`: `gift-offer` (Offer made, decider PTA / donor) → `gift-accept` (Acceptance under Policy D-15, decider per dollar threshold from the PIP) → `gift-install` (Installed / maintained, decider Facilities).
Each stage: `basis: requirement` with the policy source, or `basis: interpretation` with no source if it is the team's inference. Interpretation stages are fine; they render honestly.

- [ ] **Step 4: Write `Schools.csv`, `Needs.csv`, `Milestones.csv`, `Engage.csv`, `Inquiries.csv`**

- Schools: `oakridge`, "Oakridge Elementary School", "Arlington Public Schools", status `draft` initially.
- Needs: `hvac`, track `cip`, `current_stage_id` = the stage the CIP shows Oakridge at as of today, `cost` and `window` exactly as the CIP prints them (the script says $31M and Summer 2027–2029; use the document's numbers, and if they differ, note it in `summary` and tell Bryan, because the script's on-screen callout must change to match).
- Milestones: CIP adoption (done, date from the document), Nov 3 2026 bond referendum (next), design start, construction start, completion (later) with dates or fiscal years from the CIP. `basis: fact` for adopted dates, `estimate` for projected ones.
- Engage: School Board meetings (with sign-up URL), CCPTA, the school principal, the Facilities & Operations contact form or phone, each `basis: fact` with a source.
- Inquiries: `email-2026-04-15`: to Superintendent Durán, question as quoted in the script, response 2026-04-16, summary "Copied the principal, who will monitor the situation", status `partial`, source `email-2026-04`. Add a second row `follow-up` only if the team actually sent one; do not invent.

- [ ] **Step 5: Run sync and read the warnings**

Run: `npm run sync:local`
Expected: "Wrote 4 files" (3 tracks, 1 school). Every warning names an unsourced claim. For each: find a source, or leave it and keep Oakridge `draft`. Flip Oakridge to `live` only when the warnings list is empty. Re-run; expected zero warnings, zero errors.

- [ ] **Step 6: Write `data/sheet/RESEARCH-NOTES.md`**

A short file: what was found, what was not found, and every place the document's numbers differ from the script. This is what Bryan hands to the Authority Mapping pair.

- [ ] **Step 7: Commit**

```bash
git add data/sheet src/content
git commit -m "Add Oakridge data rows from APS primary sources

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Content collections, URL helper, DRAFT banner, home page

**Files:**
- Create: `src/content.config.ts`, `src/lib/url.ts`, `src/lib/draft.ts`, `src/components/DraftBanner.astro`, `src/components/SchoolCard.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/lib/url.test.ts`, `tests/lib/draft.test.ts`

**Interfaces:**
- Consumes: `Track`, `School` schemas (Task 2); `src/content/**` JSON (Task 4/5).
- Produces: `href(path: string, base?: string): string`; `draftState(tracks: TrackT[]): { isDraft: boolean; unconfirmed: string[] }`; `<DraftBanner tracks={TrackT[]} />`; `<SchoolCard school={SchoolT} />`; collections `tracks` and `schools`.

- [ ] **Step 1: Write the failing lib tests**

`tests/lib/url.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { href } from '../../src/lib/url';

describe('href', () => {
  it('joins base and path with exactly one slash, trailing slash preserved', () => {
    expect(href('/schools/oakridge/', '/funded/')).toBe('/funded/schools/oakridge/');
    expect(href('/schools/oakridge/', '/funded')).toBe('/funded/schools/oakridge/');
    expect(href('schools/oakridge/', '/funded/')).toBe('/funded/schools/oakridge/');
  });
  it('root path yields the base with a trailing slash', () => {
    expect(href('/', '/funded')).toBe('/funded/');
    expect(href('/', '/')).toBe('/');
  });
});
```

`tests/lib/draft.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { draftState } from '../../src/lib/draft';

const t = (id: string, verification: 'draft' | 'documented' | 'confirmed') => ({ id, name: id, verification } as any);

describe('draftState', () => {
  it('is draft when any track is not confirmed, listing them', () => {
    const s = draftState([t('cip', 'confirmed'), t('mcmm', 'documented'), t('gift', 'draft')]);
    expect(s).toEqual({ isDraft: true, unconfirmed: ['mcmm', 'gift'] });
  });
  it('is not draft when every track is confirmed', () => {
    expect(draftState([t('cip', 'confirmed')])).toEqual({ isDraft: false, unconfirmed: [] });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- tests/lib`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `src/lib/url.ts` and `src/lib/draft.ts`**

`src/lib/url.ts`:
```ts
export function href(path: string, base: string = import.meta.env.BASE_URL): string {
  const b = base.replace(/\/+$/, '');
  const p = path.replace(/^\/+/, '');
  return p ? `${b}/${p}` : `${b}/`;
}
```

`src/lib/draft.ts`:
```ts
import type { TrackT } from '../schema/records';

export function draftState(tracks: Pick<TrackT, 'id' | 'verification'>[]): { isDraft: boolean; unconfirmed: string[] } {
  const unconfirmed = tracks.filter(t => t.verification !== 'confirmed').map(t => t.id);
  return { isDraft: unconfirmed.length > 0, unconfirmed };
}
```

- [ ] **Step 4: Run lib tests**

Run: `npm test -- tests/lib`
Expected: PASS.

- [ ] **Step 5: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { Track, School } from './schema/records';

export const collections = {
  tracks: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/tracks' }), schema: Track }),
  schools: defineCollection({ loader: glob({ pattern: '*.json', base: './src/content/schools' }), schema: School }),
};
```

- [ ] **Step 6: Write `DraftBanner.astro` and `SchoolCard.astro`**

`src/components/DraftBanner.astro`:
```astro
---
import type { TrackT } from '../schema/records';
import { draftState } from '../lib/draft';
import { href } from '../lib/url';
interface Props { tracks: TrackT[] }
const { isDraft, unconfirmed } = draftState(Astro.props.tracks);
---
{isDraft && (
  <aside class="mb-8 flex flex-wrap items-center gap-4 rounded-lg border-2 border-draft bg-draft-soft p-4" role="note">
    <span class="stamp">Draft</span>
    <p class="max-w-prose text-sm">
      Who-decides information is our best current reading of APS policy and has not yet been confirmed by an APS contact
      for {unconfirmed.length} of {Astro.props.tracks.length} tracks. We are confirming it as part of this project.
      <a href={href('/tracks/')} class="underline">See what is verified.</a>
    </p>
  </aside>
)}
```

`src/components/SchoolCard.astro`:
```astro
---
import type { SchoolT } from '../schema/records';
import { href } from '../lib/url';
interface Props { school: SchoolT }
const { school } = Astro.props;
const needs = school.needs.length;
---
<a href={href(`/schools/${school.id}/`)} class="block rounded-lg border border-line bg-white p-5 transition hover:border-accent">
  <h2 class="text-2xl">{school.name}</h2>
  <p class="text-ink-muted">{school.district}</p>
  <p class="mt-3 text-sm">{needs} {needs === 1 ? 'need tracked' : 'needs tracked'}{school.status === 'draft' && ' · draft record'}</p>
</a>
```

- [ ] **Step 7: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import DraftBanner from '../components/DraftBanner.astro';
import SchoolCard from '../components/SchoolCard.astro';
const tracks = (await getCollection('tracks')).map(t => t.data);
const schools = (await getCollection('schools')).map(s => s.data).sort((a, b) => a.name.localeCompare(b.name));
---
<Base title="Check a school's status">
  <h1 class="text-4xl">Check a school's status</h1>
  <p class="mt-3 max-w-prose text-lg text-ink-muted">
    Pick a school. See what stage a facility need is at, who decides the next step, and where you can engage.
  </p>
  <div class="mt-8">
    <DraftBanner tracks={tracks} />
  </div>
  <section class="grid gap-4 sm:grid-cols-2">
    {schools.map(s => <SchoolCard school={s} />)}
  </section>
</Base>
```

- [ ] **Step 8: Build and check**

Run: `npm run build && npm run check`
Expected: build succeeds with `index.html`; check reports 0 errors. Open `npm run preview` at `http://localhost:4321/funded/` and confirm the banner and the Oakridge card render.

- [ ] **Step 9: Commit**

```bash
git add src tests/lib
git commit -m "Add content collections, URL helper, draft banner, and home page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: School page with the four blocks

**Files:**
- Create: `src/components/BasisChip.astro`, `src/components/Pipeline.astro`, `src/components/Timeline.astro`, `src/components/Deciders.astro`, `src/components/EngageList.astro`, `src/components/NeedSection.astro`
- Create: `src/pages/schools/[id].astro`
- Create: `src/lib/need.ts`
- Test: `tests/lib/need.test.ts`

**Interfaces:**
- Consumes: schemas (Task 2), `href` (Task 6), collections (Task 6).
- Produces: `stagesFor(need: NeedT, track: TrackT): Array<StageT & { state: 'done' | 'current' | 'later' }>`; `nextMilestone(need: NeedT): MilestoneT | undefined`; `decidersFor(need: NeedT, track: TrackT): { current: StageT; next?: StageT }`. `<BasisChip basis sourceId sources uid />` renders the chip and, when sourced, a native popover.

- [ ] **Step 1: Write the failing lib tests**

`tests/lib/need.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { stagesFor, nextMilestone, decidersFor } from '../../src/lib/need';

const track = { id: 'cip', stages: [
  { id: 'a', order: 1, name: 'A', decider: 'Board', basis: 'requirement' },
  { id: 'b', order: 2, name: 'B', decider: 'Voters', basis: 'requirement' },
  { id: 'c', order: 3, name: 'C', decider: 'Facilities', basis: 'requirement' },
] } as any;
const need = { id: 'hvac', track_id: 'cip', current_stage_id: 'b', milestones: [
  { id: 'm1', date: '2026-06-01', label: 'x', status: 'done', basis: 'fact' },
  { id: 'm2', date: '2026-11-03', label: 'y', status: 'next', basis: 'fact' },
  { id: 'm3', date: '2027-06-01', label: 'z', status: 'later', basis: 'estimate' },
] } as any;

describe('need helpers', () => {
  it('stagesFor marks stages before current as done, current, after as later', () => {
    expect(stagesFor(need, track).map(s => s.state)).toEqual(['done', 'current', 'later']);
  });
  it('nextMilestone returns the one with status next', () => {
    expect(nextMilestone(need)?.id).toBe('m2');
  });
  it('decidersFor returns current and following stage', () => {
    const d = decidersFor(need, track);
    expect(d.current.id).toBe('b');
    expect(d.next?.id).toBe('c');
  });
  it('decidersFor has no next at the final stage', () => {
    expect(decidersFor({ ...need, current_stage_id: 'c' }, track).next).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tests/lib/need.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/lib/need.ts`**

```ts
import type { NeedT, TrackT, StageT, MilestoneT } from '../schema/records';

export type StageState = 'done' | 'current' | 'later';

export function stagesFor(need: NeedT, track: TrackT): Array<StageT & { state: StageState }> {
  const idx = track.stages.findIndex(s => s.id === need.current_stage_id);
  return track.stages.map((s, i) => ({ ...s, state: i < idx ? 'done' : i === idx ? 'current' : 'later' }));
}

export function nextMilestone(need: NeedT): MilestoneT | undefined {
  return need.milestones.find(m => m.status === 'next');
}

export function decidersFor(need: NeedT, track: TrackT): { current: StageT; next?: StageT } {
  const idx = track.stages.findIndex(s => s.id === need.current_stage_id);
  return { current: track.stages[idx], next: track.stages[idx + 1] };
}
```

- [ ] **Step 4: Run lib tests**

Run: `npm test -- tests/lib/need.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `BasisChip.astro`**

```astro
---
import type { BasisT, SourceT } from '../schema/records';
interface Props { basis: BasisT; sourceId?: string; sources: SourceT[]; uid: string }
const { basis, sourceId, sources, uid } = Astro.props;
const src = sourceId ? sources.find(s => s.id === sourceId) : undefined;
---
{src ? (
  <>
    <button type="button" popovertarget={uid} class="chip cursor-help" aria-label={`${basis}; source: ${src.title}`}>{basis} <span aria-hidden="true">ⓘ</span></button>
    <div id={uid} popover class="max-w-sm rounded-lg border border-line bg-white p-4 text-sm shadow-lg">
      <p class="font-semibold">{src.title}</p>
      {src.publisher && <p class="text-ink-muted">{src.publisher}</p>}
      {src.retrieved_on && <p class="text-ink-muted">Retrieved {src.retrieved_on}</p>}
      {src.url && <p class="mt-2"><a href={src.url} class="text-accent underline" target="_blank" rel="noopener">Open source ↗</a></p>}
      {src.notes && <p class="mt-2">{src.notes}</p>}
    </div>
  </>
) : (
  <span class="chip chip-unsourced" title="No source recorded for this claim">{basis} · unsourced</span>
)}
```

- [ ] **Step 6: Write `Pipeline.astro`**

```astro
---
import type { NeedT, TrackT } from '../schema/records';
import { stagesFor } from '../lib/need';
interface Props { need: NeedT; track: TrackT }
const stages = stagesFor(Astro.props.need, Astro.props.track);
---
<ol class="grid gap-2" style={`grid-template-columns: repeat(${stages.length}, minmax(0, 1fr));`} aria-label="Pipeline stages">
  {stages.map((s, i) => (
    <li class="flex flex-col gap-2">
      <div class:list={['h-3 rounded-full', { 'bg-done': s.state === 'done', 'bg-accent': s.state === 'current', 'bg-later/40': s.state === 'later' }]} />
      <div class:list={['text-sm leading-tight', { 'font-semibold text-ink': s.state === 'current', 'text-ink-muted': s.state !== 'current' }]}>
        <span class="block text-[0.7rem] uppercase tracking-wide">{s.state === 'current' ? 'Now' : s.state === 'done' ? 'Done' : `Step ${i + 1}`}</span>
        {s.name}
      </div>
    </li>
  ))}
</ol>
```

- [ ] **Step 7: Write `Timeline.astro`**

```astro
---
import type { NeedT, SourceT } from '../schema/records';
import BasisChip from './BasisChip.astro';
interface Props { need: NeedT; sources: SourceT[] }
const { need, sources } = Astro.props;
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
---
<ol class="relative border-l-2 border-line pl-6">
  {need.milestones.map(m => (
    <li class:list={['relative mb-5', { 'rounded-lg border-2 border-accent bg-accent-soft p-4 -ml-6 pl-6': m.status === 'next' }]}>
      <span class:list={['absolute -left-[0.95rem] top-1.5 h-4 w-4 rounded-full border-2 border-paper', { 'bg-done': m.status === 'done', 'bg-accent': m.status === 'next', 'bg-later': m.status === 'later' }]} aria-hidden="true" />
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="text-sm text-ink-muted">{fmt(m.date)}</span>
        {m.status === 'next' && <span class="rounded bg-accent px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-white">Next</span>}
        <BasisChip basis={m.basis} sourceId={m.source_id} sources={sources} uid={`src-${need.id}-${m.id}`} />
      </div>
      <p class:list={['mt-1', { 'text-xl font-semibold': m.status === 'next' }]}>{m.label}</p>
      {(m.decider || m.venue) && <p class="text-sm text-ink-muted">{[m.decider, m.venue].filter(Boolean).join(' · ')}</p>}
      {m.status === 'next' && (need.cost || need.window) && (
        <dl class="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {need.cost && <div><dt class="text-[0.7rem] uppercase tracking-wide text-ink-muted">Cost</dt><dd class="text-lg font-semibold">{need.cost} <BasisChip basis={need.cost_basis ?? 'interpretation'} sourceId={need.cost_source_id} sources={sources} uid={`src-${need.id}-cost`} /></dd></div>}
          {need.window && <div><dt class="text-[0.7rem] uppercase tracking-wide text-ink-muted">Window</dt><dd class="text-lg font-semibold">{need.window} <BasisChip basis={need.window_basis ?? 'interpretation'} sourceId={need.window_source_id} sources={sources} uid={`src-${need.id}-window`} /></dd></div>}
        </dl>
      )}
    </li>
  ))}
</ol>
```

- [ ] **Step 8: Write `Deciders.astro` and `EngageList.astro`**

`src/components/Deciders.astro`:
```astro
---
import type { NeedT, TrackT } from '../schema/records';
import { decidersFor } from '../lib/need';
interface Props { need: NeedT; track: TrackT }
const { current, next } = decidersFor(Astro.props.need, Astro.props.track);
const cell = (label: string, s: typeof current) => ({ label, s });
const cells = [cell('Decides the current step', current), ...(next ? [cell('Decides the next step', next)] : [])];
---
<div class="grid gap-4 sm:grid-cols-2">
  {cells.map(({ label, s }) => (
    <div class="rounded-lg border border-line bg-white p-4">
      <p class="text-[0.7rem] uppercase tracking-wide text-ink-muted">{label}</p>
      <p class="mt-1 text-xl font-semibold">{s.decider}</p>
      <p class="text-ink-muted">{s.name}{s.venue ? ` · ${s.venue}` : ''}</p>
      {s.typical_duration && <p class="mt-2 text-sm text-ink-muted">Typically {s.typical_duration}</p>}
    </div>
  ))}
</div>
```

`src/components/EngageList.astro`:
```astro
---
import type { NeedT, SourceT } from '../schema/records';
import BasisChip from './BasisChip.astro';
interface Props { need: NeedT; sources: SourceT[] }
const { need, sources } = Astro.props;
---
<ul class="grid gap-3 sm:grid-cols-2">
  {need.engage.map(e => (
    <li class="rounded-lg border border-line bg-white p-4">
      <p class="text-lg font-semibold">{e.url ? <a href={e.url} class="underline decoration-line hover:decoration-accent" target="_blank" rel="noopener">{e.venue}</a> : e.venue}</p>
      {e.when && <p class="text-sm text-ink-muted">{e.when}</p>}
      {e.how && <p class="mt-1">{e.how}</p>}
      <div class="mt-2"><BasisChip basis={e.basis} sourceId={e.source_id} sources={sources} uid={`src-${need.id}-${e.id}`} /></div>
    </li>
  ))}
</ul>
```

- [ ] **Step 9: Write `NeedSection.astro`**

```astro
---
import type { NeedT, TrackT, SourceT } from '../schema/records';
import BasisChip from './BasisChip.astro';
import Pipeline from './Pipeline.astro';
import Timeline from './Timeline.astro';
import Deciders from './Deciders.astro';
import EngageList from './EngageList.astro';
import { href } from '../lib/url';
interface Props { need: NeedT; track: TrackT; sources: SourceT[] }
const { need, track, sources } = Astro.props;
const block = 'mt-10';
const h2 = 'text-2xl mb-4 flex items-baseline gap-3';
---
<article id={need.id} class="mt-6">
  <header>
    <h2 class="text-3xl">{need.title}</h2>
    {need.summary && <p class="mt-2 max-w-prose text-ink-muted">{need.summary}</p>}
  </header>

  <section class={block} aria-labelledby={`${need.id}-where`}>
    <h2 id={`${need.id}-where`} class={h2}>
      <span>Where it is</span>
      <a href={href(`/tracks/#${track.id}`)} class="rounded bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent">{track.name}</a>
      <BasisChip basis={need.stage_basis} sourceId={need.stage_source_id} sources={sources} uid={`src-${need.id}-stage`} />
    </h2>
    <Pipeline need={need} track={track} />
  </section>

  <section class={block} aria-labelledby={`${need.id}-next`}>
    <h2 id={`${need.id}-next`} class={h2}>What happens next</h2>
    <Timeline need={need} sources={sources} />
  </section>

  <section class={block} aria-labelledby={`${need.id}-who`}>
    <h2 id={`${need.id}-who`} class={h2}>Who decides</h2>
    <Deciders need={need} track={track} />
    <p class="mt-2 text-sm text-ink-muted">From the <a href={href(`/tracks/#${track.id}`)} class="underline">{track.name}</a> track, verification: {track.verification}.</p>
  </section>

  <section class={block} aria-labelledby={`${need.id}-engage`}>
    <h2 id={`${need.id}-engage`} class={h2}>Where to engage</h2>
    <EngageList need={need} sources={sources} />
  </section>
</article>
```

- [ ] **Step 10: Write `src/pages/schools/[id].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import DraftBanner from '../../components/DraftBanner.astro';
import NeedSection from '../../components/NeedSection.astro';

export async function getStaticPaths() {
  const schools = await getCollection('schools');
  return schools.map(s => ({ params: { id: s.data.id }, props: { school: s.data } }));
}
const { school } = Astro.props;
const tracks = (await getCollection('tracks')).map(t => t.data);
const trackById = new Map(tracks.map(t => [t.id, t]));
---
<Base title={school.name}>
  <p class="text-sm text-ink-muted">{school.district}</p>
  <h1 class="text-4xl">{school.name}</h1>
  <div class="mt-6"><DraftBanner tracks={tracks} /></div>
  {school.needs.map(need => {
    const track = trackById.get(need.track_id);
    if (!track) throw new Error(`school ${school.id}: need ${need.id} references unknown track ${need.track_id}`);
    return <NeedSection need={need} track={track} sources={school.sources} />;
  })}
</Base>
```

- [ ] **Step 11: Build, check, and look**

Run: `npm run build && npm run check && npm run preview`
Expected: `dist/schools/oakridge/index.html` exists; 0 check errors. Open `http://localhost:4321/funded/schools/oakridge/`: four headed blocks in order, the Nov 3 milestone highlighted with cost and window beside it, chips clickable and opening a popover with the source.

- [ ] **Step 12: Commit**

```bash
git add src tests/lib/need.test.ts
git commit -m "Add school page: pipeline, timeline, deciders, engage, sourced chips

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Inquiries log and sources list

**Files:**
- Create: `src/components/Inquiries.astro`, `src/components/SourceList.astro`
- Modify: `src/components/NeedSection.astro` (append two sections after "Where to engage")
- Modify: `src/pages/schools/[id].astro` (append `<SourceList>` after the needs)

**Interfaces:**
- Consumes: `InquiryT`, `SourceT` (Task 2); `BasisChip` (Task 7).
- Produces: `<Inquiries need sources />`, `<SourceList sources />`.

- [ ] **Step 1: Write `Inquiries.astro`**

```astro
---
import type { NeedT, SourceT } from '../schema/records';
interface Props { need: NeedT; sources: SourceT[] }
const { need, sources } = Astro.props;
const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const label = { answered: 'Answered', partial: 'Partial answer', unanswered: 'No answer' } as const;
const tone = { answered: 'bg-done text-white', partial: 'bg-warn text-white', unanswered: 'bg-draft text-white' } as const;
---
{need.inquiries.length > 0 && (
  <ol class="divide-y divide-line rounded-lg border border-line bg-white">
    {need.inquiries.map(q => {
      const src = q.source_id ? sources.find(s => s.id === q.source_id) : undefined;
      return (
        <li class="p-4">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span>{fmt(q.date)}</span><span>to {q.to}</span>
            <span class={`rounded px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide ${tone[q.status]}`}>{label[q.status]}</span>
          </div>
          <blockquote class="mt-2 border-l-4 border-line pl-3 italic">{q.question}</blockquote>
          {q.response_summary && <p class="mt-2"><span class="text-ink-muted">Response{q.response_date ? ` on ${fmt(q.response_date)}` : ''}:</span> {q.response_summary}</p>}
          {src && <p class="mt-1 text-sm text-ink-muted">Source: {src.title}</p>}
        </li>
      );
    })}
  </ol>
)}
```

- [ ] **Step 2: Write `SourceList.astro`**

```astro
---
import type { SourceT } from '../schema/records';
interface Props { sources: SourceT[] }
const { sources } = Astro.props;
---
<section class="mt-12 border-t border-line pt-6" aria-labelledby="sources">
  <h2 id="sources" class="text-2xl mb-3">Sources</h2>
  <ol class="list-decimal space-y-2 pl-6 text-sm">
    {sources.map(s => (
      <li id={`source-${s.id}`}>
        {s.url ? <a href={s.url} class="underline" target="_blank" rel="noopener">{s.title}</a> : s.title}
        {s.publisher && <span class="text-ink-muted"> · {s.publisher}</span>}
        {s.retrieved_on && <span class="text-ink-muted"> · retrieved {s.retrieved_on}</span>}
        {s.notes && <span class="block text-ink-muted">{s.notes}</span>}
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 3: Append the inquiries section to `NeedSection.astro`**

After the "Where to engage" section, before `</article>`:
```astro
  {need.inquiries.length > 0 && (
    <section class={block} aria-labelledby={`${need.id}-asked`}>
      <h2 id={`${need.id}-asked`} class={h2}>What has been asked</h2>
      <Inquiries need={need} sources={sources} />
    </section>
  )}
```
And add `import Inquiries from './Inquiries.astro';` to the frontmatter.

- [ ] **Step 4: Append `SourceList` to the school page**

In `src/pages/schools/[id].astro`, add `import SourceList from '../../components/SourceList.astro';` and, after the needs map, `<SourceList sources={school.sources} />`.

- [ ] **Step 5: Build and look**

Run: `npm run build && npm run check`
Expected: 0 errors; the Oakridge page shows the April inquiry with a "Partial answer" badge and a numbered sources list at the bottom.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "Add inquiries log and sources list to school page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Tracks page and roadmap page

**Files:**
- Create: `src/pages/tracks.astro`, `src/pages/roadmap.astro`, `src/components/TrackLane.astro`

**Interfaces:**
- Consumes: `TrackT` (Task 2), `href` (Task 6), `BasisChip` (Task 7), `DraftBanner` (Task 6).

- [ ] **Step 1: Write `TrackLane.astro`**

```astro
---
import type { TrackT } from '../schema/records';
import BasisChip from './BasisChip.astro';
interface Props { track: TrackT }
const { track } = Astro.props;
const vlabel = { draft: 'Draft', documented: 'Documented, not yet confirmed', confirmed: 'Confirmed with APS' } as const;
---
<section id={track.id} class="rounded-lg border border-line bg-white p-5">
  <header class="flex flex-wrap items-baseline justify-between gap-2">
    <h2 class="text-2xl">{track.name}</h2>
    <span class:list={['rounded px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide', track.verification === 'confirmed' ? 'bg-done text-white' : 'bg-draft-soft text-draft']}>{vlabel[track.verification]}</span>
  </header>
  <p class="mt-2 text-ink-muted">{track.description}</p>
  <dl class="mt-3 text-sm">
    <dt class="font-semibold">When a need goes on this track</dt><dd>{track.routing_rule}</dd>
    {track.policy_citation && <><dt class="mt-2 font-semibold">Policy</dt><dd>{track.policy_citation}</dd></>}
    {track.verified_by && <><dt class="mt-2 font-semibold">Verified by</dt><dd>{track.verified_by}{track.verified_on ? `, ${track.verified_on}` : ''}</dd></>}
  </dl>
  <ol class="mt-4 space-y-2">
    {track.stages.map(s => (
      <li class="flex gap-3">
        <span class="mt-1 h-6 w-6 shrink-0 rounded-full bg-accent-soft text-center text-sm font-semibold text-accent">{s.order}</span>
        <div>
          <p class="font-semibold">{s.name} <BasisChip basis={s.basis} sourceId={s.source_id} sources={track.sources} uid={`src-${track.id}-${s.id}`} /></p>
          <p class="text-sm text-ink-muted">Decides: {s.decider}{s.venue ? ` · ${s.venue}` : ''}{s.typical_duration ? ` · typically ${s.typical_duration}` : ''}</p>
        </div>
      </li>
    ))}
  </ol>
</section>
```

- [ ] **Step 2: Write `src/pages/tracks.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import DraftBanner from '../components/DraftBanner.astro';
import TrackLane from '../components/TrackLane.astro';
const order = ['cip', 'mcmm', 'gift'];
const tracks = (await getCollection('tracks')).map(t => t.data).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
---
<Base title="How it works">
  <h1 class="text-4xl">How a school facility need gets decided</h1>
  <p class="mt-3 max-w-prose text-lg text-ink-muted">Three tracks, three different owners. A need lands on one of them based on what it is and what it costs.</p>
  <div class="mt-6"><DraftBanner tracks={tracks} /></div>
  <div class="grid gap-5 lg:grid-cols-3">
    {tracks.map(t => <TrackLane track={t} />)}
  </div>
</Base>
```

- [ ] **Step 3: Write `src/pages/roadmap.astro`**

```astro
---
import Base from '../layouts/Base.astro';
const phases = [
  { n: 1, name: 'Transparency', state: 'now', line: 'For a real need at a real school: what stage it is at, who decides next, and where to engage. Verified with APS.' },
  { n: 2, name: 'Funding', state: 'planned', line: 'Match real needs to real non-bond sources: state energy grants, utility rebates, federal programs. Not built.' },
  { n: 3, name: 'Beyond Arlington', state: 'planned', line: 'Only if Phase 1 proves out here, where we have access and trust.' },
];
---
<Base title="Roadmap">
  <h1 class="text-4xl">Roadmap</h1>
  <p class="mt-3 max-w-prose text-lg text-ink-muted">We are starting narrow on purpose.</p>
  <ol class="mt-8 grid gap-4 md:grid-cols-3">
    {phases.map(p => (
      <li class:list={['rounded-lg border-2 p-5', p.state === 'now' ? 'border-accent bg-white' : 'border-dashed border-line bg-transparent text-ink-muted']}>
        <p class="text-[0.7rem] uppercase tracking-wide">{p.state === 'now' ? 'Phase 1 · Now' : `Phase ${p.n} · Planned`}</p>
        <h2 class="mt-1 text-2xl">{p.name}</h2>
        <p class="mt-2">{p.line}</p>
      </li>
    ))}
  </ol>
  <p class="mt-8 max-w-prose text-sm text-ink-muted">Phase boundaries and Phase 1 success criteria are owned by the Feasibility and Success Measures workstream and will be updated here as they are finalized.</p>
</Base>
```

- [ ] **Step 4: Build and check**

Run: `npm run build && npm run check`
Expected: `dist/tracks/index.html` and `dist/roadmap/index.html` exist; 0 errors. Three lanes render with verification badges; the roadmap shows Phase 1 solid and 2 and 3 dashed.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "Add tracks (authority map) and roadmap pages

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Google Sheet template and README

**Files:**
- Create: `scripts/build-sheet-template.py`, `data/sheet/Legend.csv`
- Modify: `README.md` (replace the "Connecting the Sheet" section)
- Output (committed): `data/FundED-data-template.xlsx`

**Interfaces:**
- Consumes: `data/sheet/*.csv` from Task 5, column list mirrored from `TAB_COLUMNS`.

- [ ] **Step 1: Write `data/sheet/Legend.csv`**

```csv
tab,column,meaning,allowed_values
Tracks,track_id,Short id for the track (lowercase-dashes),
Tracks,verification,Has an APS contact confirmed this track's stages and deciders?,draft | documented | confirmed
Stages,order,Position of the stage within its track (1 = first),whole number
Stages,basis,What kind of claim the stage is,fact | requirement | estimate | interpretation
Schools,status,live = every claim must have a source or the site will not build; draft = warnings only,live | draft
Needs,current_stage_id,Must be a stage_id that belongs to the need's track_id,
Needs,stage_basis / cost_basis / window_basis,What kind of claim each is,fact | requirement | estimate | interpretation
Milestones,status,Exactly one milestone per need must be next,done | next | later
Milestones,date,ISO date,YYYY-MM-DD
Engage,basis,What kind of claim the venue is,fact | requirement | estimate | interpretation
Inquiries,status,Did the authority answer the question?,answered | partial | unanswered
Sources,source_id,Referenced by every *_source_id column. Add the document here first.,
(all),*_id,Lowercase letters and digits and dashes only. No spaces.,
(all),blank cell,Leave blank when unknown. Never type TBD or ?.,
```

- [ ] **Step 2: Write `scripts/build-sheet-template.py`**

```python
#!/usr/bin/env python3
"""Build data/FundED-data-template.xlsx from data/sheet/*.csv with header styling,
frozen header row, and dropdown validation on enum columns. Upload the xlsx to
Google Drive and open with Google Sheets; validation carries over."""
import csv
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "sheet"
OUT = ROOT / "data" / "FundED-data-template.xlsx"
TABS = ["Tracks", "Stages", "Schools", "Needs", "Milestones", "Engage", "Inquiries", "Sources", "Legend"]
ENUMS = {
    "basis": "fact,requirement,estimate,interpretation",
    "stage_basis": "fact,requirement,estimate,interpretation",
    "cost_basis": "fact,requirement,estimate,interpretation",
    "window_basis": "fact,requirement,estimate,interpretation",
    "verification": "draft,documented,confirmed",
}
STATUS = {"Schools": "live,draft", "Milestones": "done,next,later", "Inquiries": "answered,partial,unanswered"}
FONT = "Arial"

wb = Workbook()
wb.remove(wb.active)
for tab in TABS:
    ws = wb.create_sheet(tab)
    with open(SRC / f"{tab}.csv", newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    for r in rows:
        ws.append(r)
    header = rows[0]
    for c in ws[1]:
        c.font = Font(name=FONT, bold=True)
        c.fill = PatternFill("solid", fgColor="E3EEF7")
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = Font(name=FONT)
    ws.freeze_panes = "A2"
    for i, name in enumerate(header, start=1):
        col = ws.cell(row=1, column=i).column_letter
        ws.column_dimensions[col].width = max(14, min(60, max(len(str(r[i-1])) if i-1 < len(r) else 0 for r in rows) + 2))
        values = ENUMS.get(name) or (STATUS.get(tab) if name == "status" else None)
        if values and tab != "Legend":
            dv = DataValidation(type="list", formula1=f'"{values}"', allow_blank=True, showErrorMessage=True,
                                errorTitle="Not an allowed value", error=f"Use one of: {values.replace(',', ', ')}")
            ws.add_data_validation(dv)
            dv.add(f"{col}2:{col}500")
wb.save(OUT)
print(f"wrote {OUT.relative_to(ROOT)} with tabs: {', '.join(TABS)}")
```

- [ ] **Step 3: Run it**

Run: `python3 scripts/build-sheet-template.py`
Expected: `wrote data/FundED-data-template.xlsx with tabs: Tracks, ..., Legend`. Then verify the dropdowns: `python3 -c "from openpyxl import load_workbook; wb=load_workbook('data/FundED-data-template.xlsx'); print([ (ws.title, len(ws.data_validations.dataValidation)) for ws in wb])"` shows non-zero counts for Tracks, Stages, Schools, Needs, Milestones, Engage, Inquiries.

- [ ] **Step 4: Replace the README "Connecting the Sheet" section**

```markdown
## Connecting the Sheet (one-time, Bryan)

1. Upload `data/FundED-data-template.xlsx` to the project's Google Drive folder. Right-click → Open with → Google Sheets. Rename the resulting Sheet "FundED data". Delete the .xlsx copy from Drive to avoid two files with the same name.
2. In the Sheet: File → Share → Publish to web → "Entire document", format "Comma-separated values (.csv)" → Publish. Copy the URL. It looks like `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`.
3. Paste the part up to and including `/pub` into `publishedCsvBase` in `sync.config.json`.
4. For each tab, click it and read the number after `#gid=` in the browser URL. Put it in `gids` for that tab.
5. Run `npm run sync`. Fix anything it reports (tab and row number are given). Then `git diff --stat src/content`, and commit.
6. Share the Sheet with the team (editor). Point them at the Legend tab.

The published CSV is readable by anyone with the link. The Inquiries tab summarizes the April 2026 email exchange; it is already quoted in the public pitch video. If that changes, switch to a service account (about one hour) before adding anything more sensitive.

## Updating data later

Teammates edit the Sheet. Bryan runs `npm run sync`, reviews the diff, commits, pushes. GitHub Pages redeploys in about a minute. The filmed demo uses whatever is committed, so a Sheet edit never changes the site until someone runs sync.

## Adding a school

Sources tab first (add every document you will cite). Then Schools, Needs (one row per need), Milestones (exactly one `next` per need), Engage, Inquiries. Set the school `status` to `draft` until every claim has a source; the sync output lists what is missing.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/build-sheet-template.py data/sheet/Legend.csv data/FundED-data-template.xlsx README.md
git commit -m "Add Google Sheet template builder and data workflow docs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Playwright screenshots of the recording path

**Files:**
- Create: `playwright.config.ts`, `e2e/recording-path.spec.ts`

**Interfaces:**
- Consumes: the built site from Tasks 6 to 9.
- Produces: `e2e/screenshots/*.png` (gitignored), reviewed by the implementer before the task is called done.

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/funded/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4321/funded/' },
  projects: [
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
  ],
});
```

- [ ] **Step 2: Write `e2e/recording-path.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('recording path: home → Oakridge → four blocks', async ({ page }, info) => {
  const shot = (name: string) => page.screenshot({ path: `e2e/screenshots/${info.project.name}-${name}.png`, fullPage: true });

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Check a school's status");
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  await shot('1-home');

  await page.getByRole('link', { name: /Oakridge/ }).click();
  await expect(page).toHaveURL(/\/schools\/oakridge\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Oakridge');

  for (const h of ['Where it is', 'What happens next', 'Who decides', 'Where to engage']) {
    await expect(page.getByRole('heading', { name: new RegExp(h) })).toBeVisible();
  }
  await expect(page.getByText('Next', { exact: true })).toHaveCount(1);
  await shot('2-oakridge');

  // Source popover opens without JavaScript beyond the platform.
  const chip = page.getByRole('button', { name: /source:/ }).first();
  await chip.click();
  await expect(page.locator('[popover]:popover-open')).toBeVisible();
  await shot('3-popover');
});

test('tracks and roadmap render', async ({ page }) => {
  await page.goto('./tracks/');
  await expect(page.locator('section#cip, section#mcmm, section#gift')).toHaveCount(3);
  await page.goto('./roadmap/');
  await expect(page.getByText('Phase 1 · Now')).toBeVisible();
});
```

- [ ] **Step 3: Install a browser, build, run**

Run: `npx playwright install chromium && npm run build && npm run e2e`
Expected: both projects pass; six PNGs in `e2e/screenshots/`.

- [ ] **Step 4: Look at the screenshots**

Open each PNG with the Read tool. Check, in order: the Draft stamp is legible at laptop width; the Oakridge page's "Next" milestone card is the visually heaviest element; nothing overflows horizontally at phone width; chip text is readable. Fix spacing or type size in the component involved, rebuild, rerun. Repeat until all four hold. Record what changed in the commit message.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts e2e/recording-path.spec.ts src
git commit -m "Add Playwright recording-path check and visual fixes from screenshots

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Publish to GitHub Pages

**Files:**
- None new. Repo settings and a push.

- [ ] **Step 1: Create the public repo and push**

```bash
cd ~/code/active/funded
gh repo create brabsmit/funded --public --source=. --remote=origin --description "Where a school facility need stands, who decides next, and where to engage. APS pilot." --push
```
Expected: remote `origin` added, `main` pushed.

- [ ] **Step 2: Set Pages to deploy from Actions**

```bash
gh api -X POST repos/brabsmit/funded/pages -f build_type=workflow 2>/dev/null || gh api -X PUT repos/brabsmit/funded/pages -f build_type=workflow
gh workflow run "Deploy to GitHub Pages" && sleep 90 && gh run list --workflow "Deploy to GitHub Pages" --limit 1
```
Expected: the run shows `completed success`.

- [ ] **Step 3: Verify the live URL**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://brabsmit.github.io/funded/schools/oakridge/`
Expected: `200`. Open the URL in a browser and click through the recording path once.

- [ ] **Step 4: Commit nothing; report**

Tell Bryan: the live URL, the three items only he can do (upload the Sheet template and publish it; paste the April email into the Inquiries row if the summary needs correcting; send the Joe message), and every place where the APS documents disagreed with the script's numbers (from `data/sheet/RESEARCH-NOTES.md`).
