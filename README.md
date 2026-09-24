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
