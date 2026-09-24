import { describe, it, expect } from 'vitest';
import { tabUrl } from '../../scripts/sync/fetch';

describe('tabUrl', () => {
  it('builds a by-name gviz URL when sheetId is set', () => {
    expect(tabUrl({ sheetId: 'abc123' }, 'Tracks')).toBe(
      'https://docs.google.com/spreadsheets/d/abc123/gviz/tq?tqx=out:csv&sheet=Tracks',
    );
  });
  it('prefers sheetId over a published base when both are set', () => {
    expect(tabUrl({ sheetId: 'abc123', publishedCsvBase: 'https://x/pub', gids: { Tracks: 5 } }, 'Tracks')).toContain('/d/abc123/gviz');
  });
  it('builds a published-CSV URL with the tab gid as a fallback', () => {
    expect(tabUrl({ publishedCsvBase: 'https://docs.google.com/spreadsheets/d/e/2PACX/pub', gids: { Needs: 42 } }, 'Needs')).toBe(
      'https://docs.google.com/spreadsheets/d/e/2PACX/pub?gid=42&single=true&output=csv',
    );
  });
  it('names the missing gid', () => {
    expect(() => tabUrl({ publishedCsvBase: 'https://x/pub', gids: {} }, 'Engage')).toThrow('gids.Engage');
  });
  it('explains what to set when nothing is configured', () => {
    expect(() => tabUrl({}, 'Tracks')).toThrow('sheetId');
  });
});
