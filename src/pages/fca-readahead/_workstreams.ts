// Workstream data for the unlisted FCA PRD (index.astro) and its per-workstream sub-PRDs ([ws].astro).
// Underscore prefix keeps Astro from routing this file. Figures keep the research report's flags:
// [LOW] aggregator/vendor marketing, [VENDOR] sells into K-12, [UNVERIFIED] no primary confirmation.

export interface Deliverable { d: string; due: string; accept: string }
export interface Workstream {
  n: string; slug: string; name: string; staff: string; scope: string; qs: string; feeds: string;
  objective: string;
  context: string[];
  inScope: string[];
  outScope: string[];
  targets: { who: string; why: string; n: string }[];
  guide: { q: string; probes: string[] }[];
  desk: string[];
  threshold: { owns: string; rule: string; method: string };
  deliverables: Deliverable[];
  upstream: string[];
  downstream: string[];
  plan: [string, string][];
  risks: { r: string; m: string }[];
  frameworks: string[];
  rules: string[];
}

const commonRules = [
  'Log every contact the same day: who, role, date, what they said, verbatim quotes where possible. WS6 needs this for the appendix.',
  'Introduce yourself as a Georgetown EMBA team doing course research. Offer respondents a summary of findings in return for their time.',
  'Keep the research report’s reliability flags ([LOW], [VENDOR], [UNVERIFIED]) on any figure you reuse. A flagged figure can’t carry a conclusion.',
];

export const workstreams: Workstream[] = [
  {
    n: 'WS1', slug: 'ws1', name: 'APS & public records', staff: 'Lead + support',
    scope: 'One APS interview request (no follow-ups); FOIA follow-up and cost-estimate replies the same day; coordinate with the Ethics outreach pair before any APS contact.',
    qs: 'Q1, Q4', feeds: 'R4 gate; rejects A; T5 evidence',
    objective: 'Get APS’s own numbers on incentives captured and left unclaimed (Q1), and APS’s view on paying to publish decision gates (Q4), without spending the goodwill the Ethics project needs through Feb 19, 2027.',
    context: [
      'A Virginia FOIA request went to foia@apsva.us on Wed Oct 14 for FY2024–present: (1) Dominion/Washington Gas rebates received, (2) IRA elective-pay filings and payments, (3) state and federal facility/energy funding applications and awards, (4) the Board-directed non-bond financing analysis and any ESCO solicitation, proposal or contract.',
      'APS charges $30/hr for staff time and requires prepayment above $200. Our estimate: about $90–$360.',
      'APS must respond within 5 working days (~Wed Oct 21), or take 7 more (~Fri Oct 30). The clock pauses while a cost estimate is pending (Va. Code § 2.2-3704(F)).',
      'The APS Board capped new bonds at $100M for FY2027–36 and directed a non-bond financing analysis naming energy performance contracts (Jan 2026). APS publishes no project-status tracker.',
      'The CCPTA letter criticized APS for “selectively disclosing costs,” so APS may read a parent-built tool as advocacy (T5).',
    ],
    inScope: [
      'One interview request each to APS Facilities & Operations (energy manager) and Finance for Q1.',
      'One interview request to APS Communications or the Chief of Staff’s office for Q4.',
      'FOIA management: reply to any cost estimate the same day; narrow scope if it exceeds $200 (drop item 3 first, then item 2; limit item 4 to final deliverables and executed contracts).',
      'Desk work: Q2 (non-bond analysis status from Board agendas), Q5 (procurement thresholds from the Purchasing Resolution), Q6 ($100M cap vs the $142M TJMS referendum).',
    ],
    outScope: [
      'Follow-up nudges after the single ask. Silence is evidence for T5.',
      'Speaking at or attending Board meetings as FundED.',
      'Pitching or selling anything to APS.',
      'Any contact the Ethics outreach pair hasn’t been told about.',
    ],
    targets: [
      { who: 'APS energy manager (Facilities & Operations)', why: 'Q1: incentives captured and left unclaimed; who applies; ESCO engagement', n: '1' },
      { who: 'APS Finance (capital budget or grants)', why: 'Q1 cross-check; where rebate receipts are booked', n: '1' },
      { who: 'APS Communications or Chief of Staff’s office', why: 'Q4: would APS pay to publish gates; who owns “Engage with APS”', n: '1' },
    ],
    guide: [
      { q: 'Over FY24–26, which utility rebates, elective-pay credits or state programs did APS claim for facility or energy work?', probes: ['Roughly how much in total?', 'Who files: APS staff, a contractor, or an ESCO?', 'Is there a list we could see, or is it in the FOIA records?'] },
      { q: 'Were there incentives you knew about but didn’t pursue? Why not?', probes: ['Staff time (capacity), eligibility and timing changes (complexity), or fitting money to projects (matching)? (Q3)', 'Any you’d estimate were worth more than $25K?'] },
      { q: 'Where does the Board’s non-bond financing analysis stand?', probes: ['Who is doing it?', 'Is an ESCO already engaged, or an RFP planned?'] },
      { q: 'If someone published where each project sits and who decides the next step, would that help APS or create problems?', probes: ['Who would own it relative to “Engage with APS”?', 'Is there a budget line for this kind of tool, and under what amount can a department buy without a formal solicitation?', 'Does APS license ClearGov or OpenGov today?'] },
    ],
    desk: [
      'Q2: Board agendas and minutes since Jan 2026 for the non-bond financing analysis and any ESCO item.',
      'Q5: APS Purchasing Resolution: resolve the $10K single-quote tier (2020) vs the $200K departmental figure; check for cooperative contracts (Sourcewell, VASCUPP, OMNIA).',
      'Q6: how the $100M bond cap counts the $142M TJMS project planned for a 2028 referendum.',
    ],
    threshold: {
      owns: 'Angle A (confirm rejection); supplies APS data to WS2’s R4 threshold.',
      rule: 'A is dead if APS says “we’d do it in-house or with an existing vendor,” or there’s no budget line under $10K.',
      method: 'Record the answer verbatim. If APS doesn’t answer by Oct 28, record “no response” as T5 evidence; don’t chase it.',
    },
    deliverables: [
      { d: 'APS contact log and FOIA status', due: 'Oct 21', accept: 'Each ask dated; FOIA response or extension notice logged; any cost estimate answered the same day.' },
      { d: 'Desk memo: Q2, Q5, Q6', due: 'Oct 23', accept: 'Each answer sourced to an APS document, or marked unresolved with what was checked.' },
      { d: 'Q1 numbers from APS records, if any', due: 'Oct 24', accept: 'Handed to WS2 by noon for the R4 gate review, with source and fiscal year.' },
      { d: 'Q4 answer, or a note that APS stayed silent', due: 'Oct 28', accept: 'Verbatim answer or a dated “no response” entry.' },
    ],
    upstream: ['Ethics outreach pair: told about every APS contact before it happens.'],
    downstream: ['WS2: Q1 data for the R4 gate (Oct 24).', 'WS4: procurement threshold for the Step 1 matrix.', 'WS6: T5 evidence and the A verdict.'],
    plan: [
      ['Oct 15', 'Brief the Ethics outreach pair; agree who sends the APS asks.'],
      ['Oct 16', 'Send the three interview requests (one email each, no follow-up scheduled).'],
      ['Oct 19–20', 'Desk work Q2, Q5, Q6. Watch for a FOIA cost estimate; reply the same day.'],
      ['Oct 21', 'FOIA initial response due. Log it.'],
      ['Oct 22–23', 'Interviews if APS accepted. Finish the desk memo.'],
      ['Oct 24', 'Hand any Q1 numbers to WS2 by noon.'],
      ['Oct 26–28', 'Close Q4. Final contact log to WS6.'],
    ],
    risks: [
      { r: 'APS reads the FOIA plus interview asks as advocacy (T5).', m: 'Single ask, course-research framing, coordination with the Ethics pair.' },
      { r: 'APS takes the 7-day extension (~Oct 30), after the gate review.', m: 'WS2 sizes Q1 from outside sources in parallel; FOIA becomes confirmation, not the source.' },
      { r: 'Cost estimate above $200.', m: 'Narrow in this order: drop item 3, then item 2, then limit item 4.' },
    ],
    frameworks: ['DE Step 12, Determine the Customer’s Decision-Making Unit (who at APS would buy, approve or block).', 'DE Step 13, Map the Process to Acquire a Paying Customer (procurement tiers and timing).'],
    rules: commonRules,
  },
  {
    n: 'WS2', slug: 'ws2', name: 'Energy & incentives', staff: 'Two people, both full-time',
    scope: 'Critical path. ESCO reps, a Dominion program implementer, UndauntedK12. Size what a district leaves unclaimed, independent of APS.',
    qs: 'Q1 (non-APS route), Q13', feeds: 'R4; component 4 (Steps 15–16); component 5',
    objective: 'Decide R4 by Fri Oct 24: does a district like APS leave at least ~$25K a year in facility/energy incentives unclaimed, and can that value be captured before an energy performance contract without the ESCO already doing it?',
    context: [
      'R4 is the only path with a clear check-writer: shared savings, the district pays a share of value captured (DE Step 15). Pricing anchor: ~20% of value created (DE Step 16). One paying unit ≈ $5–10K/yr, so the district needs $25–50K of capturable value.',
      'ESCOs already capture incentives: at least two-thirds of Renew America’s Schools Round 1 grantees had performance-contracting partners. Ameresco bundled ~$550K state reimbursement + ~$70K utility incentives for Junction City SD, and $883K incentives + an $815K rebate for Wayne NJ [VENDOR].',
      'The federal pool is shrinking (T3): ESSER closed; 179D, 45W, 30C ended; Renew America’s Schools frozen. Durable inventory: utility rebates, state programs, financing structures, surviving elective pay.',
      'Dominion Energy Virginia business rebates are active and contractor-mediated; public-school eligibility is [UNVERIFIED]. Likely highest relevance for APS.',
      'Elective-pay uptake looks low: 11 districts announced checks Nov 2025–Jun 2026 (UndauntedK12).',
    ],
    inScope: [
      'Interviews: 2 ESCO account reps, 1 Dominion program implementer, UndauntedK12; optionally Generation180.',
      'Sizing Q1 from outside APS: what a district of APS’s size typically claims vs leaves unclaimed.',
      'Desk follow-ups Q16, Q17, Q19 and the Virginia ESPC program (not yet researched).',
      'The district energy-manager persona for R4 (DE Steps 3, 5).',
    ],
    outScope: [
      'Selling or pre-selling R4 to anyone.',
      'Contacting APS staff (WS1 owns that).',
      'Modeling federal programs that have ended, except as the “cliff” context.',
    ],
    targets: [
      { who: 'ESCO account rep: Ameresco', why: 'Q13: minimum project size; when incentives are identified; who keeps the value', n: '1' },
      { who: 'ESCO account rep: a second firm (e.g. Trane, JCI or Siemens)', why: 'Same as above; check it isn’t one firm’s practice', n: '1' },
      { who: 'Dominion program implementer', why: 'Typical rebate value for a large school district; who applies; leads', n: '1' },
      { who: 'UndauntedK12', why: 'Elective-pay uptake; unclaimed value; would they share data or refer districts (Q15)', n: '1' },
    ],
    guide: [
      { q: 'In a typical K-12 performance contract, at what point are utility rebates and state incentives identified, and who keeps that value?', probes: ['Is it netted into the guaranteed savings, passed through to the district, or retained?', 'What’s the smallest school project you’d take on?'] },
      { q: 'For a district of ~27,600 students, what does it typically claim in utility rebates a year? What does it typically miss?', probes: ['Why do districts miss them: staff time, eligibility rules, or timing?', 'Can you give a range rather than a number?'] },
      { q: 'If a district arrived with an incentive inventory already done, would that help or hurt your process?', probes: ['Would you pay for qualified leads?', 'Would you see a third party doing this as a competitor?'] },
      { q: '(UndauntedK12) How many districts that could use elective pay actually do, and what stops the rest?', probes: ['Would you share project data or refer districts?'] },
    ],
    desk: [
      'Q16: Renew America’s Schools FY25/FY26 status and the ~$196M rescission outcome.',
      'Q17: elective-pay treatment of ground-source heat pumps after OBBB.',
      'Q19: Dominion public-school eligibility and opt-out rules.',
      'Virginia ESPC program: how school divisions procure performance contracts.',
    ],
    threshold: {
      owns: 'R4 / angle C. Its result decides the FCA verdict’s exception.',
      rule: 'R4 is dead if unclaimed incentives are under ~$25K/yr per district, or if ESCOs already pass that value to districts before contracting.',
      method: 'Triangulate at least three sources (ESCO, implementer, UndauntedK12, plus WS1’s APS data if it arrives). Report a low–high range. Pass only if the low end of a credible range clears $25K.',
    },
    deliverables: [
      { d: 'Outreach sent', due: 'Oct 16', accept: 'All four targets contacted, with names and dates logged.' },
      { d: 'C sizing memo + R4 go/no-go', due: 'Oct 24', accept: 'A range with a named source for each input; a one-line pass/kill against the threshold; flags kept.' },
      { d: 'ESCO: competitor or channel?', due: 'Oct 26', accept: 'One paragraph of bullets with quotes, for component 5.' },
      { d: 'Energy-manager persona notes', due: 'Oct 28', accept: 'DE Step 5 fields filled from interviews, or marked as assumptions.' },
    ],
    upstream: ['WS1: APS Q1 data, if any, by noon Oct 24.'],
    downstream: ['WS6: the R4 verdict for the gate review and component 5.', 'Component 4 drafting: Step 15 shared-savings model and Step 16 pricing.', 'WS5: the UndauntedK12 relationship (one contact, not two).'],
    plan: [
      ['Oct 15', 'Split targets between the two owners; draft outreach emails.'],
      ['Oct 16', 'Send all outreach.'],
      ['Oct 19–20', 'Desk Q16, Q17, Q19, VA ESPC. First calls.'],
      ['Oct 21–23', 'Remaining calls. Build the range.'],
      ['Oct 24', 'Gate review with WS6: R4 pass or kill.'],
      ['Oct 26–28', 'ESCO note and persona notes.'],
    ],
    risks: [
      { r: 'ESCOs and implementers overstate value ([VENDOR] bias).', m: 'Ask for ranges; use the low end; triangulate.' },
      { r: 'Nobody gives a number.', m: 'Treat “no data” as a kill. R4 can’t pass without evidence.' },
      { r: 'ESCOs treat the call as lead generation.', m: 'Say upfront it’s course research and there’s nothing to sell.' },
    ],
    frameworks: ['DE Step 15, Design a Business Model (shared savings).', 'DE Step 16, Set Your Pricing Framework (~20% of value created).', 'DE Steps 3 and 5 (end user profile, persona) for the energy manager.'],
    rules: commonRules,
  },
  {
    n: 'WS3', slug: 'ws3', name: 'Parents & civic stewards', staff: 'Lead + support',
    scope: 'CCPTA delegates and PTA facilities chairs; CCPTA survey; County CIP map team; foundations and 21CSF as stewards. Estimate the annual maintenance cost before interviews.',
    qs: 'Q8, Q9, Q11', feeds: 'R3; component 3 persona (Steps 3, 5)',
    objective: 'Find out whether any steward will take over and fund the gate map (R3), and confirm what parents would pay and whom they trust. That gives component 3 a persona backed by evidence.',
    context: [
      'CCPTA and the Civic Federation formally demanded transparency on $598M of needs across 41 buildings. CCPTA: communities are “under the impression that renovations… are happening soon.”',
      'PTA software sells for ~$100–$300/yr [VENDOR]; free substitutes exist (T4).',
      'Email is the primary channel for most parents (51%, [VENDOR]). Output must be forwardable, not another login.',
      'The County already runs a CIP Interactive Map; whether it covers APS projects is [UNVERIFIED].',
      'Keeping the map current takes real work. The site’s daily freshness check is already flagging a stale Ashlawn milestone. Use that as evidence in the cost estimate.',
    ],
    inScope: [
      'Annual maintenance cost estimate (hours × rate) before any steward conversation.',
      '~8 interviews with CCPTA delegates and PTA facilities/advocacy chairs.',
      'A ≤5-minute survey sent via CCPTA email, if CCPTA agrees.',
      'Steward conversations: Arlington County Budget/CIP map team, the Civic Federation, 21CSF, one local foundation.',
    ],
    outScope: [
      'Advocacy on the bond referendum or any specific school’s needs.',
      'Recruiting PTAs as paying customers (R2: the explorer stays free).',
    ],
    targets: [
      { who: 'CCPTA delegates and PTA facilities/advocacy chairs', why: 'Q7–Q9: how often asked, where they look, what they’d pay, whom they trust', n: '~8' },
      { who: 'CCPTA leadership', why: 'Survey distribution; grant fund size (Q8)', n: '1' },
      { who: 'Arlington County Budget/CIP map team', why: 'Q11: does the map cover APS; would the County host or fund school status', n: '1' },
      { who: '21CSF, the Civic Federation, one local foundation', why: 'Steward appetite and funding range', n: '2–3' },
    ],
    guide: [
      { q: 'How often do parents ask you when a repair at your school will happen? Where do you look for the answer now?', probes: ['Last time it happened, what did you do?', 'What answer did you get?'] },
      { q: 'If a tool showed where each project stands and who decides next, who would you trust to run it: APS, a PTA, or a neutral party like the County or a foundation?', probes: ['Why?'] },
      { q: 'Would your PTA pay for that out of its budget? Roughly how much a year?', probes: ['Has CCPTA’s grant fund paid for anything like this? How large is it?'] },
      { q: '(Steward) If a maintained record of school-project status were handed to you, would you host or fund it? At what annual cost would that be realistic?', probes: ['Who would decide?', 'On what timeline?'] },
    ],
    desk: [
      'Check whether the County CIP Interactive Map includes APS projects.',
      'PTA and foundation budgets from Form 990s where available.',
      'Survey instrument: ≤8 questions, banded willingness to pay ($0 / ≤$100 / ≤$300 / ≤$500 / more), neutral wording. Review with Kanze’s respondent-time guidance.',
    ],
    threshold: {
      owns: 'R3 / angle B, and the parent-tier test.',
      rule: 'R3 fails if no steward will fund at or above our annual maintenance cost. The parent tier fails if median willingness to pay is ≤ $300/yr and no grant fund covers maintenance.',
      method: 'Fix the maintenance cost estimate first (Oct 18) so the bar exists before any steward names a number.',
    },
    deliverables: [
      { d: 'Maintenance cost estimate (hours × rate)', due: 'Oct 18', accept: 'Line items: data updates, freshness checks, APS re-confirmation, hosting. Stated assumptions.' },
      { d: 'Survey live via CCPTA', due: 'Oct 19', accept: 'CCPTA’s OK in writing; instrument filed for the appendix.' },
      { d: 'Parent interviews done', due: 'Oct 26', accept: '~8 logged with quotes; survey results summarized with response count.' },
      { d: 'Steward named, or “none found”', due: 'Oct 28', accept: 'Each steward’s answer recorded verbatim.' },
      { d: 'PTA-chair persona update', due: 'Oct 28', accept: 'DE Step 5 fields backed by interviews.' },
    ],
    upstream: ['WS5: what exactly would be handed off (format, scope).'],
    downstream: ['WS6: the R3 verdict and component 3 persona.', 'WS5: County map team relationship (one contact).'],
    plan: [
      ['Oct 15–16', 'Draft survey and interview guide; ask CCPTA leadership about distribution.'],
      ['Oct 17–18', 'Maintenance cost estimate.'],
      ['Oct 19', 'Survey live (if CCPTA agrees).'],
      ['Oct 19–26', 'Parent interviews; steward conversations.'],
      ['Oct 27–28', 'Summaries, persona, steward verdict.'],
    ],
    risks: [
      { r: 'CCPTA declines to send the survey.', m: 'Fall back to interviews only; state the sample limit in the paper.' },
      { r: 'Only highly engaged parents respond (selection bias).', m: 'Report it; don’t generalize from it.' },
      { r: 'These are the same parents the Ethics project relies on.', m: 'Frame clearly as course research; coordinate with the Ethics team.' },
    ],
    frameworks: ['DE Step 3, Build an End User Profile for the Beachhead Market.', 'DE Step 5, Profile the Persona for the Beachhead Market.', 'DE Step 15: grants aren’t on its list of business models, so state that for R3.'],
    rules: commonRules,
  },
  {
    n: 'WS4', slug: 'ws4', name: 'Market & comparables', staff: 'Lead + support',
    scope: 'Comparable and small/rural VA divisions; competitive matrix; TAM as a flagged range; Step 1 matrix inputs for A–D.',
    qs: 'Q12', feeds: 'Rejects D; component 3 (Steps 1, 2, 4)',
    objective: 'Test angle D and build the market evidence: competitive matrix, TAM range, and the inputs for the DE Step 1 seven-question matrix that carries the verdict.',
    context: [
      'Illustrative district TAM: $69.3M–$199.8M/yr (13,318 districts × $5,200–$15,000), all prices assumed. The spread is the finding.',
      'Virginia: 2,132 schools, 213 LEAs, 1,260,351 students (NCES SY 2022–23). VA+DC SAM of $2.8–4.3M/yr is an upper bound; swap in the count of regular VA divisions.',
      'Competitive matrix axes: budget line → project stage (x), “shows numbers” → “explains who decides and which funding fits” (y). No profiled tool occupies the top right.',
      'Capacity evidence is from adjacent domains only (FEMA BRIC, Race to the Top). No study measures K-12 energy-grant capture by district capacity.',
    ],
    inScope: [
      '3 comparable divisions (e.g. Alexandria, Fairfax, Prince William): facilities or communications staff.',
      '2–3 small or rural Virginia division finance officers.',
      'Competitive matrix, adding independent energy consultants (a gap in the current research).',
      'TAM/SAM table with flags; the Step 1 matrix inputs for A–D.',
    ],
    outScope: ['New national market-sizing research beyond filling the named gaps.', 'Outreach to APS.'],
    targets: [
      { who: 'Comparable division facilities or comms staff (e.g. Alexandria, Fairfax, Prince William)', why: 'Q12: same tracker gap? who paid for any project pages?', n: '3' },
      { who: 'Small/rural VA division finance officers', why: 'D test: binding constraint and spending authority', n: '2–3' },
    ],
    guide: [
      { q: 'When parents ask where a facility project stands, what do you point them to?', probes: ['Did you build or buy a project dashboard? Who paid, and why?'] },
      { q: '(Small/rural) What stops your division from claiming more facility or energy funding?', probes: ['Not knowing what exists, the paperwork, or the local match/money?', 'Who writes grants today?'] },
      { q: 'Could you spend $5K on a service like this without a board vote?', probes: ['What would it have to prove first?'] },
    ],
    desk: [
      'Q20: the APS 2023 facility condition backlog figure and total FY27–36 CIP.',
      'Q21: national PTO and education-foundation counts (IRS BMF, NTEE B11/B12).',
      'Q22: actual ClearGov and OpenGov contract values in Virginia (eVA, board agendas).',
      'The count of regular Virginia school divisions, for the SAM.',
    ],
    threshold: {
      owns: 'Angle D (confirm rejection), plus the Step 1 matrix inputs.',
      rule: 'D is dead if fewer than 2 of 5 contacts name information or matching (not money or local match) as the binding constraint, or none can spend $5K without a board vote.',
      method: 'Score each Step 1 cell 1–5 with a cited piece of evidence; no score without a source.',
    },
    deliverables: [
      { d: 'Competitive matrix draft', due: 'Oct 21', accept: 'Report axes; independent energy consultants added; every price keeps its flag.' },
      { d: 'D test result', due: 'Oct 26', accept: 'Tally against the threshold, with quotes.' },
      { d: 'Step 1 inputs for all four options', due: 'Oct 27', accept: 'Seven Workbook questions × A–D, each cell scored with a cited source.' },
      { d: 'TAM/SAM table', due: 'Oct 27', accept: 'Range, formulas shown, flags kept, VA division count swapped in.' },
    ],
    upstream: ['WS1: procurement thresholds.', 'WS2 and WS3: evidence for the C and B cells.'],
    downstream: ['WS6: the Step 1 matrix and verdict.', 'Component 3 drafting.'],
    plan: [
      ['Oct 15–16', 'Identify contacts; send outreach.'],
      ['Oct 19–21', 'Competitive matrix draft; desk Q20–Q22.'],
      ['Oct 19–26', 'Five or six interviews.'],
      ['Oct 26', 'D tally.'],
      ['Oct 27', 'Step 1 inputs and TAM table to WS6.'],
    ],
    risks: [
      { r: 'Rural contacts are hard to reach from DC in 10 days.', m: 'Start Oct 16; use alumni and Hoya Gateway; report the sample size.' },
      { r: 'TAM read as load-bearing.', m: 'Present it as a range and say it isn’t the basis of the verdict.' },
    ],
    frameworks: ['DE Step 1, Market Segmentation (the seven-question matrix).', 'DE Step 2, Select a Beachhead Market.', 'DE Step 4, Estimate the Total Addressable Market.'],
    rules: commonRules,
  },
  {
    n: 'WS5', slug: 'ws5', name: 'Gate map & competing plays', staff: 'Lead + support',
    scope: 'Get the gate map signed off (/aps/confirm/) via the Ethics pair; publish it as open data; towntoonify conversation; one partner conversation.',
    qs: 'Q14', feeds: 'R1, R5; component 5 competing plays',
    objective: 'Deliver R1 (a verified gate map published as open data) and R5 (at least one real competing play). Component 5 has to recommend how to compete even under a “no.”',
    context: [
      'The gate map covers three tracks (CIP, MC/MM, gift under Policy D-15) and is still marked DRAFT pending APS confirmation. The site has a printable sign-off sheet at /aps/confirm/.',
      'towntoonify publishes an “open JSON standard” and invites school districts. A shared format could make our data the reference instead of a rebuild target.',
      'Likely partners rather than rivals: UndauntedK12, Generation180, the County CIP map team, ESCOs as a channel.',
      'The FundED tool belongs to the Ethics project (through Feb 19, 2027). Licensing or releasing its data needs the Ethics team’s agreement.',
    ],
    inScope: [
      'APS sign-off on the gate map, routed through the Ethics outreach pair (not a new ask).',
      'Documenting the data format (from the site’s existing schema) and choosing an open license.',
      'The towntoonify conversation (Q14).',
      'One logged partner conversation (UndauntedK12 jointly with WS2, or the County jointly with WS3).',
    ],
    outScope: ['New explorer features (non-goal).', 'Signing any agreement before the Ethics team agrees.'],
    targets: [
      { who: 'towntoonify founder', why: 'Q14: school-district plans; partner, license or compete; JSON compatibility', n: '1' },
      { who: 'Ethics team', why: 'Agreement to release the data and name a license', n: '1 meeting' },
      { who: 'One partner (with WS2 or WS3)', why: 'R5 competing play', n: '1' },
    ],
    guide: [
      { q: '(towntoonify) Are you building school districts yet? Do you show project stage or who decides?', probes: ['Would you use a decision-gate dataset if one existed in your format?', 'Would you build that yourself?'] },
      { q: '(Partner) If we published this data openly, would you use it, link to it, or maintain it?', probes: ['What format would you need?'] },
    ],
    desk: [
      'Document the data model from the site’s existing schema as a data dictionary.',
      'Compare with towntoonify’s published JSON standard.',
      'Choose an open data license and get the Ethics team’s agreement.',
    ],
    threshold: {
      owns: 'Input to component 5 (no kill threshold of its own).',
      rule: 'If towntoonify says it will add “who decides” itself, the licensing play is dead and T1 is confirmed. Record it either way.',
      method: 'Log the answer verbatim and pass it to WS6.',
    },
    deliverables: [
      { d: 'towntoonify conversation held', due: 'Oct 23', accept: 'Verbatim notes; the partner/license/compete answer recorded.' },
      { d: 'Open-data format documented', due: 'Oct 27', accept: 'Data dictionary, license named, Ethics team agreement recorded.' },
      { d: 'Partner conversation logged', due: 'Oct 28', accept: 'One partner, with a clear yes, no or maybe and the reason.' },
      { d: 'Competing-plays memo', due: 'Oct 28', accept: 'Bullets for component 5: each play, its evidence, and a status.' },
    ],
    upstream: ['Ethics outreach pair: APS sign-off status.', 'WS2 and WS3: shared partner contacts.'],
    downstream: ['WS6: component 5 recommendations.', 'WS3: what a steward would receive.'],
    plan: [
      ['Oct 15', 'Meet the Ethics team: sign-off status and data release.'],
      ['Oct 16', 'Contact towntoonify.'],
      ['Oct 19–23', 'towntoonify call; data dictionary.'],
      ['Oct 26–28', 'Partner conversation; memo to WS6.'],
    ],
    risks: [
      { r: 'Releasing data before APS confirms it.', m: 'Keep the DRAFT label and basis on every unconfirmed gate.' },
      { r: 'The conversation tips off a competitor.', m: 'Share only what’s already public on the site.' },
      { r: 'Ethics team objects to the release.', m: 'Raise it Oct 15; the paper can recommend the play without having executed it.' },
    ],
    frameworks: ['Stitch Fix sustainable-advantage debate (Pipino, Kim & Mauborgne, INSEAD 2019): a data advantage vs Amazon entering; ours vs ClearGov/towntoonify.', 'DE Step 15: freemium is a way to acquire customers, not a business model (R2).'],
    rules: commonRules,
  },
  {
    n: 'WS6', slug: 'ws6', name: 'Synthesis & paper', staff: 'Lead + support (overlaps others)',
    scope: 'Lock thresholds; run the daily threshold scoreboard; compile mindset baselines; check every DE step against the filed Workbook; assemble the paper, exec summary, APA references and appendices; submit.',
    qs: 'n/a', feeds: 'Components 1, 2, 5; exec summary',
    objective: 'Protect the integrity of the verdict and ship the paper: thresholds locked before evidence arrives, every claim cited, every framework named, defined and applied, submitted before noon on Nov 2.',
    context: [
      'Spec: Word doc, 5 pages, 11-pt, single-spaced, 1" margins, excluding exec summary, APA references, tables, figures and appendices. Graded on how precisely we define, apply and cite course material.',
      'Late work loses 10% per calendar day; the Canvas timestamp is the only test. Peer evaluations are due at the same time.',
      'Cite the 2017 DE Workbook. Confirmed in the filed chapters: Steps 1–5, 8, 9, 12, 13, 15–19. Not confirmed: Steps 11 and 20–21. Canvas cites “Steps 1 & 1A”; the Workbook has no 1A.',
      'Hearts + Minds formula (Day 1 slide): frustrated by [x] → because we all had [y] → so we introduced [z] → we’re not alone ([x] million people, $$$, growth rate).',
      'The AI policy for written work isn’t stated; confirm with Kanze. Final prose is the team’s own.',
    ],
    inScope: [
      'Thresholds locked in writing and shared before any interview.',
      'A daily threshold scoreboard: each test open, pass or kill, with an evidence link.',
      'Collecting everyone’s seven mindset measures for component 2.',
      'The Oct 24 gate review with WS2.',
      'Citation audit, paper assembly, appendices, submission.',
    ],
    outScope: ['Changing a threshold after interviews start.', 'Primary interviews (other workstreams own them).'],
    targets: [
      { who: 'Kanze (walk-ins Wed 1–3 pm, Room 549, or a workshop)', why: 'Is a team-level “not equipped” a definitive stance? Protocol feedback; AI policy', n: '1' },
      { who: 'Every teammate', why: 'Mindset baseline reports', n: '~6' },
    ],
    guide: [
      { q: '(Kanze) Is a team-level “we are not equipped to sustain an advantage, except under these conditions” an acceptable definitive stance for component 5?', probes: [] },
      { q: '(Kanze) How should AI use count for written work in this course?', probes: [] },
    ],
    desk: [
      'Verify every DE step number against the filed Workbook chapters before it appears in the paper.',
      'Pull definitions for the seven mindset measures from the Day 1 materials.',
      'APA references for every source in the research report that the paper uses.',
    ],
    threshold: {
      owns: 'The verdict rule. If R4 passes, C stands as the exception; if not, the paper is a clean “no” with competing plays from WS5.',
      rule: 'No threshold moves after Oct 18.',
      method: 'The scoreboard is the evidence trail and goes into the appendix.',
    },
    deliverables: [
      { d: 'Thresholds locked in writing', due: 'Oct 18', accept: 'Dated, shared with the whole team, unchanged afterward.' },
      { d: 'Mindset baselines collected', due: 'Oct 18', accept: 'All seven measures for every teammate.' },
      { d: 'R4 gate review', due: 'Oct 24', accept: 'Pass or kill recorded on the scoreboard with WS2’s memo.' },
      { d: 'Step 1 matrix + verdict', due: 'Oct 28', accept: 'Every cell sourced; the verdict follows from the scoreboard.' },
      { d: 'Full draft', due: 'Oct 30', accept: 'All five components plus exec summary; citation audit done.' },
      { d: 'Paper submitted on Canvas', due: 'Nov 2, noon', accept: 'Submitted by Sun Nov 1 evening; every member confirms peer evaluation submitted.' },
    ],
    upstream: ['Every workstream: logs, memos, verdicts on the dates above.'],
    downstream: ['The paper.'],
    plan: [
      ['Oct 15–18', 'Lock thresholds; collect baselines; ask Kanze.'],
      ['Oct 19–23', 'Daily scoreboard; start the citation audit.'],
      ['Oct 24', 'R4 gate review.'],
      ['Oct 26–28', 'Step 1 matrix; verdict.'],
      ['Oct 29', 'Outline by component; assign drafting.'],
      ['Oct 30', 'Full draft.'],
      ['Oct 31–Nov 1', 'Review, page count, references; submit Sun evening.'],
    ],
    risks: [
      { r: 'The verdict reads as motivated reasoning.', m: 'Locked thresholds and the scoreboard in the appendix.' },
      { r: 'Over 5 pages.', m: 'Move tables and the matrix to appendices; they don’t count.' },
      { r: 'A late workstream holds up the draft.', m: 'Write with “pending” placeholders; the verdict rule decides the frame either way.' },
    ],
    frameworks: ['All of them, cited precisely: DE Workbook steps; the seven mindset measures; Hearts + Minds; Eisenmann (HBR 2013); Aldrich & Ruef; Kanze & Iyengar (HBR 2017); Kanze, Conley & Higgins (HBR 2020); Stitch Fix and Dropbox cases.'],
    rules: commonRules,
  },
];
