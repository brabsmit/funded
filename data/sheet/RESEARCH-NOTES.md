# Oakridge research notes — handoff to Authority Mapping

Source: `.superpowers/sdd/2026-09-24-funded-explorer/oakridge-research.md` (retrieved 2026-09-24).

## $31M scope correction
The CIP prints $31M only in the bond-project list, for the whole "Refresh" (HVAC, roofing,
flooring, painting) — not HVAC alone: "Oakridge Elementary Refresh Project (HVAC, roofing,
flooring, painting) - $31M" (`cip-fy27-36`, Executive Summary). No document prices HVAC by
itself. `Needs.cost` is written as `$31M (whole Refresh: HVAC, roofing, flooring, painting)`
so the on-screen callout can't imply $31M is the HVAC cost. If other site copy says "$31M
HVAC project," fix that copy too.

## "Contingent on the bond" is our interpretation
Oakridge Refresh is named inside Question 4 ($80M) on the Nov 3 2026 ballot
(`county-bond-2026`), but the County page also says the School Board "may reallocate bond
funds among other school projects" in the CIP. No source says what happens to Oakridge
specifically if the bond fails or passes. We confirmed bond-funded + on the ballot; anything
stronger ("contingent," "guaranteed if passed") is our inference, not a quote.

## Policy D-15 — draft only
Only a January 2025 first-draft revision was fetchable (memo through Dr. Durán); BoardDocs
blocked the live policy pages. `Tracks.csv` policy_citation for `gift` says "(2025 draft
text)" and the track stays `verification: draft`. To confirm adopted thresholds, open
https://go.boarddocs.com/vsba/arlington/Board.nsf/goto?open=&id=B26QVF6B23A6 (Active
Policies) and find D-15 + its PIP. Note: the draft itself has a gap between "less than
$100,000" and "greater than or equal to $100,001" approval tiers — quoted as printed.

## MC/MM cutoff — not found
FY27 budget line is $3.0M one-time (`aps-budget-page`); no definition or dollar cutoff vs.
CIP was found anywhere (CIP glossary defines "Major Maintenance" with no threshold). `mcmm`
track stays `draft` with no `policy_citation`. Untried leads: Policy F-5.7 "Capital and
Maintenance Program" (404'd via curl, try a browser), and the Sep 29 2026 work session
"Facilities – Maintenance, Work Orders, and MCMM from FY 2026."

## Nov 3 vs Nov 4
CIP report and County bond page both say Nov 3, 2026; APS `engage/cip` page says Nov 4. We
treated Nov 4 as a typo and used Nov 3 everywhere (sourced to `county-bond-2026`);
`aps-engage-cip` stays in `Sources.csv` with a note but nothing cites it for the date.

## Milestone date conventions
CIP gives only season/year for two dates: "Summer 2027" (construction start) → written as
`2027-06-01`; "2029" (completion) → written as `2029-01-01`. Both first-day-of-period by our
convention, both `basis: estimate`. The two "done" milestones (CIP adoption 2026-06-18,
County CIP adoption 2026-07-21) are exact dates as printed, `basis: fact`.

## Not reached
CCPTA (Oakridge PTA) page; APS Facilities & Operations contact page/form; BoardDocs agenda
pages for the Sep 24 2026 Board meeting and Sep 29 2026 work sessions (only the September
schedule post was read); the County Board resolution date that put Question 4 on the ballot
(only the July 21 2026 County CIP adoption date was found); CIP Appendix C funding timeline
(image, not text-extracted).

## Sync result
`npm run sync:local` at `Schools.oakridge.status = live`: zero warnings, zero errors. Every
claim (stage, cost, window, each milestone, each engage row) has a `source_id`. One
`Inquiries` row (`email-2026-04-15`, source `email-2026-04`) — no second row exists because
no follow-up was actually sent.
