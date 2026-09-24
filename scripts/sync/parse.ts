import Papa from 'papaparse';

export type Row = Record<string, string>;
export type Problem = { tab: string; row?: number; message: string };

export function parseHeader(csv: string): string[] {
  const first = Papa.parse<string[]>(csv.replace(/^﻿/, ''), { preview: 1, skipEmptyLines: true }).data[0] ?? [];
  return first.map(h => h.trim());
}

export function parseTab(csv: string): Row[] {
  const result = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: false,
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  });
  const rows: Row[] = [];
  for (const raw of result.data) {
    const row: Row = {};
    for (const [k, v] of Object.entries(raw)) if (k && v !== '') row[k] = v;
    rows.push(row);
  }
  // Drop only *trailing* blank placeholders (a file ending in blank lines, or the phantom
  // empty line produced by a trailing newline) so those don't become phantom rows. Blank
  // rows in the middle stay as `{}` placeholders so later rows keep their real spreadsheet
  // row number (header = row 1, first data row = row 2).
  while (rows.length > 0 && Object.keys(rows[rows.length - 1]).length === 0) rows.pop();
  return rows;
}

export function requireColumns(tab: string, _rows: Row[], header: string[], required: string[]): Problem[] {
  return required.filter(c => !header.includes(c)).map(c => ({ tab, message: `missing column "${c}"` }));
}
