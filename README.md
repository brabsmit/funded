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
| `npm run check` | Astro type/diagnostics check |
| `npm run preview` | serve the production build locally |
| `npm run sync` | fetch the published Sheet, validate, write content |
| `npm run sync:local` | same, from the CSVs already in `data/sheet/` |
| `npm test` | unit tests |
| `npm run test:watch` | unit tests, watch mode |
| `npm run e2e` | Playwright screenshots of the recording path |
| `python3 scripts/build-sheet-template.py` | rebuild `data/FundED-data-template.xlsx` (needs `openpyxl`) |

## Connecting the Sheet (one-time, Bryan)

1. Upload `data/FundED-data-template.xlsx` to the project's Google Drive folder and open it with Google Sheets. If Sheets shows it in Office mode (an `.xlsx` badge by the title), use File → Save as Google Sheets so teammates get normal collaborative editing; that creates a new file with a new id, so do step 3 again afterwards. The header row is frozen, not protected; to lock it, select row 1 → Data → Protect sheets and ranges.
2. Share → General access: "Anyone with the link", role Viewer. Give teammates Editor access individually. (No "Publish to web" is needed.)
3. Copy the long id from the Sheet's URL (`docs.google.com/spreadsheets/d/<id>/edit`) into `sheetId` in `sync.config.json`. Tabs are fetched by name, so the tab names must stay exactly `Tracks`, `Stages`, `Schools`, `Needs`, `Milestones`, `Engage`, `Inquiries`, `Sources`.
4. Run `npm run sync`. Fix anything it reports (tab and row number are given). Then `git diff --stat src/content`, and commit.
5. Point teammates at the Legend tab.

Anyone with the link can read the Sheet. The Inquiries tab summarizes the April 2026 email exchange; it is already quoted in the public pitch video. If that changes, switch to a service account (about one hour) before adding anything more sensitive.

## Updating data later

Teammates edit the Sheet. Bryan runs `npm run sync`, reviews the diff, commits, pushes. GitHub Pages redeploys in about a minute. The filmed demo uses whatever is committed, so a Sheet edit never changes the site until someone runs sync.

If a remote sync fails, `data/sheet/` may hold a mix of fresh and old CSVs; run `git checkout data/sheet` or fix the Sheet and re-run.

## Adding a school

Sources tab first (add every document you will cite). Then Schools, Needs (one row per need), Milestones (exactly one `next` per need), Engage, Inquiries. Set the school `status` to `draft` until every claim has a source; the sync output lists what is missing.
