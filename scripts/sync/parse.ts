import Papa from 'papaparse';

export type Row = Record<string, string>;
export type Problem = { tab: string; row?: number; message: string };

const BLANK = '__blank_';

export function parseHeader(csv: string): string[] {
  const first = Papa.parse<string[]>(csv.replace(/^﻿/, ''), { preview: 1, skipEmptyLines: true }).data[0] ?? [];
  return first.map(h => h.trim());
}

export function parseTab(csv: string): Row[] {
  const result = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: false,
    // Blank header cells get a unique placeholder (so Papa does not warn about duplicates) and are dropped below.
    transformHeader: (h, i) => h.trim() || `${BLANK}${i}`,
    transform: v => v.trim(),
  });
  const rows: Row[] = [];
  for (const raw of result.data) {
    const row: Row = {};
    for (const [k, v] of Object.entries(raw)) if (k && !k.startsWith(BLANK) && v !== '') row[k] = v;
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

/** A named column that appears more than once: only one copy would be read, so a teammate's edits in the other vanish. */
export function duplicateColumns(tab: string, header: string[]): Problem[] {
  const counts = new Map<string, number>();
  for (const h of header) if (h) counts.set(h, (counts.get(h) ?? 0) + 1);
  return [...counts].filter(([, n]) => n > 1).map(([h, n]) => ({ tab, message: `column "${h}" appears ${n} times; only one is read` }));
}
