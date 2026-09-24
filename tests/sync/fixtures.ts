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
    Funding: [
      { funding_id: 'q4', need_id: 'hvac', label: 'Question 4 school bond', amount: '80000000', basis: 'fact', source_id: 'cip-2027' },
      { funding_id: 'refresh', need_id: 'hvac', label: 'Oakridge Refresh', amount: '31000000', parent_id: 'q4', basis: 'estimate', source_id: 'cip-2027' },
    ],
    Sources: [
      { source_id: 'cip-2027', title: 'APS CIP FY2027-2036', publisher: 'Arlington Public Schools', url: 'https://www.apsva.us/cip', retrieved_on: '2026-09-24' },
    ],
  };
}
