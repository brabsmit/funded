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
  it('a blank row between data rows becomes a placeholder so later rows keep their spreadsheet row number', () => {
    expect(parseTab('a,b\n1,2\n,\n3,4\n')).toEqual([{ a: '1', b: '2' }, {}, { a: '3', b: '4' }]);
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
