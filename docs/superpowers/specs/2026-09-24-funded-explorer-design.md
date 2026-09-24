# FundED Explorer — Design Spec

**Date:** 2026-09-24
**Owner:** Bryan (Workstream 5, Transparency Tool / Artifact Design)
**Status:** Approved in conversation; awaiting written review

## Purpose

A public, static website that answers one question for a parent, principal, or PTA member: *for a specific facility need at a specific school, what stage is it at, who decides the next step, and where can I engage?*

It exists first as the on-screen demo for segment 5 of the Oct 3 pitch video (1:50–2:40), but it is designed as the seed of the real Phase 1 deliverable: finalized against verified data in November and handed off to Arlington Public Schools (APS) or 21CSF in January. It is also the likely URL submitted for the course.

Authoritative source documents for scope are those dated after the Sep 20 team pivot: `pitch-video-script-draft v0.2.md`, `Draft Answers to Questions.docx`, and `FundED-project-tracker.xlsx`. The intro email's funding-navigator framing is retired; funding matching is Phase 2 and appears only as a labeled roadmap item.

## Design principles

1. **Explain the process without pretending to know more than the evidence supports.** Every claim carries a `basis` (fact, requirement, estimate, interpretation) and a source. Unsourced claims render visibly as unsourced.
2. **The DRAFT status is data, not decoration.** Verification status lives on the track records and drives the DRAFT stamp everywhere it appears, so the authority map (segment 4) and the tool demo (segment 5) cannot disagree.
3. **Teammates do not edit code or YAML.** The Google Sheet is the source of truth. The repo holds a committed snapshot.
4. **Filming is deterministic.** The site renders from committed data. A sheet edit cannot change what is on screen until Bryan runs sync and commits.
5. **Nothing costs money.** No backend, no login, no paid services, no spend from the $2,000.

## Data model

### Source of truth: Google Sheet

One Google Sheet in the project's Drive folder, beside the project tracker. Tabs:

| Tab | One row per | Key columns |
|---|---|---|
| `Tracks` | funding/approval track | `track_id`, `name`, `description`, `routing_rule`, `policy_citation`, `verification` (draft / documented / confirmed), `verified_by`, `verified_on` |
| `Stages` | stage within a track | `stage_id`, `track_id`, `order`, `name`, `decider`, `venue`, `typical_duration`, `basis`, `source_id` |
| `Schools` | school | `school_id`, `name`, `district`, `status` (live / draft), `notes` |
| `Needs` | facility need | `need_id`, `school_id`, `title`, `category`, `summary`, `track_id`, `current_stage_id`, `stage_basis`, `stage_source_id`, `cost`, `cost_basis`, `cost_source_id`, `window`, `window_basis`, `window_source_id` |
| `Milestones` | dated step for a need | `milestone_id`, `need_id`, `date`, `label`, `status` (done / next / later), `decider`, `venue`, `basis`, `source_id` |
| `Engage` | venue a person can act in | `engage_id`, `need_id`, `venue`, `when`, `how`, `url`, `source_id` |
| `Inquiries` | question asked of an authority | `inquiry_id`, `need_id`, `date`, `to`, `question`, `response_date`, `response_summary`, `status` (answered / partial / unanswered), `source_id` |
| `Sources` | citable document | `source_id`, `title`, `publisher`, `url`, `retrieved_on`, `notes` |
| `Legend` | (documentation) | column meanings, allowed values, how to add a school |

Controlled fields (`basis`, `status`, `verification`, `track_id`, `stage_id`, `school_id`, `need_id`, `source_id`) use in-sheet data validation dropdowns. Header row is locked. The sheet is published to the web as CSV per tab; the sync script fetches by tab `gid`.

**Known trade-off:** publish-to-web makes the sheet readable to anyone with the link. The Inquiries tab will hold a summary of the April 2026 superintendent email exchange, which is already going in a public video. If that becomes a concern, the fallback is a Google service account key in a GitHub secret (about one hour of setup).

### Repo data files

`src/content/tracks/*.json` and `src/content/schools/*.json`, written only by the sync script. Schools are denormalized: one file per school containing its needs, and each need containing its milestones, engagement venues, inquiries, and the subset of sources it references. Tracks contain their ordered stages.

Zod schemas in `src/schema/` are the single definition of a valid record. Both Astro content collections and the sync script import them.

### Claims and provenance

A "claim" is any user-facing statement of fact about a need. The enumerated set, which is what the build rule checks, is: the need's current stage, cost, and window; every milestone; and every engagement venue. Track stages (decider, venue, duration) are claims on the track and are covered by the track's verification status rather than per-claim sourcing. Each claim carries:

- `basis`: `fact` | `requirement` | `estimate` | `interpretation`
- `source_id`: reference into the school's sources list, or empty

Rendering rules:
- Claim with source: basis chip plus a source tooltip (title, publisher, retrieved date, link).
- Claim without source: basis chip plus an "unsourced" marker.
- Build rule: a school with `status: live` fails the build if any claim on any of its needs is unsourced. A `draft` school only warns.

## Sync script

`npm run sync`:

1. Fetches each tab's CSV from the published sheet.
2. Parses rows into typed records.
3. Validates every record against the Zod schemas and checks referential integrity (every `need_id`, `track_id`, `stage_id`, `source_id` resolves).
4. Prints **all** problems found, with tab and row number, then exits non-zero without writing anything.
5. On success, writes the JSON data files and prints a summary of what changed.

Bryan runs it, reviews the git diff, commits. No automated sync workflow for Oct 3; can be added later as a scheduled or on-demand GitHub Action.

## Pages

Static site, four routes.

### `/` Home
- One sentence: what the tool does.
- DRAFT banner, rendered if any track is not `confirmed`.
- List of schools as cards. Oakridge is the only live card at launch.
- No search until there are enough schools to need one.

### `/schools/[school_id]/` School page
Header (school name, district). Each need rendered fully expanded on the same page, in this order:

1. **Where it is.** Track badge, then a horizontal pipeline of the track's stages with done / current / later states.
2. **What happens next.** Milestone timeline. The `next` milestone gets the visual weight, with cost and window shown beside it. For Oakridge: Nov 3 2026 bond referendum, $31M, Summer 2027–2029.
3. **Who decides.** Decider and venue for the current stage and the next stage, pulled from the track's stage records.
4. **Where to engage.** Venues with dates, how-to, and links.

Below the fold: Inquiries log (question, date, response status), Sources list. Every claim shows a basis chip; hover/tap shows the source.

### `/tracks/` How it works
The authority map: three lanes (CIP, MC/MM, Equipment gift), each with routing rule, policy citation, stages, deciders. DRAFT stamp driven by the verification field. Intended to be screenshotted for segment 4.

### `/roadmap/`
Phase 1 (now): transparency. Phase 2 (planned): funding matching. Phase 3 (planned): beyond Arlington. Phases 2 and 3 visibly marked planned. Holds the Feasibility pair's boundary language when it exists.

### Recording path
Home → click Oakridge → scroll through the four blocks. Two clicks. No hover-dependent content on this path. Base type size roughly one-third larger than a typical site so a phone recording of a laptop screen stays legible.

### Visual direction
Plain-language civic, not startup. The pipeline and timeline are the graphics. DRAFT is a real stamp, not a footnote. Light and dark both acceptable; light is the filming default.

## Stack and deploy

- Astro (latest stable), TypeScript, Tailwind.
- Content collections with Zod schemas.
- No client-side framework. Only client JS is the source tooltip.
- Public repo `brabsmit/funded`. GitHub Pages via the official Astro action on push to `main`. Site URL `https://brabsmit.github.io/funded` (base path `/funded`).
- Repo location: `~/code/active/funded`.

## Verification

| Layer | What it catches |
|---|---|
| Sync validation | Malformed rows, bad enum values, dangling IDs, missing columns. Reports all at once. |
| Vitest unit tests on the sync parser | Good sheet round-trips; missing column, dangling reference, unsourced claim on live school each produce the expected error. |
| Astro build | Content collection schema violations; the live-school unsourced-claim rule. |
| Playwright screenshots | Recording path rendered at 1440×900 and 390×844; Bryan sees images before touching the site. |
| CI | Build on every push; deploy only from `main`. |

## Real data (work item, not design)

Oakridge facts are to be pulled from APS primary sources with URL and retrieval date: the current CIP, the Nov 3 2026 bond referendum resolution, Policy D-15 (gift acceptance thresholds), and the MC/MM (Major Construction / Minor Maintenance) definitions and cost cutoff. Anything not found in a primary source is entered with `basis: interpretation` or left unverified so the DRAFT stamp is truthful. The April 15–16 2026 email exchange is supplied by Bryan.

## Out of scope for Oct 3

- Search, filtering, multiple districts.
- Automated sheet sync in CI.
- Funding-source matching (Phase 2).
- Any authentication, comments, or user-submitted data.
- Custom domain.

## Related, outside the tool

Rubric criteria 3, 4, and 8 require hours per person. Add an `Hours` tab to the existing project tracker. Not part of this build.
