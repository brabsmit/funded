import Papa from 'papaparse';

export type Row = Record<string, string>;
export type Problem = { tab: string; row?: number; message: string };

export function parseHeader(csv: string): string[] {
  const first = Papa.parse<string[]>(csv, { preview: 1, skipEmptyLines: true }).data[0] ?? [];
  return first.map(h => h.trim());
}

export function parseTab(csv: string): Row[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  });
  const rows: Row[] = [];
  for (const raw of result.data) {
    const row: Row = {};
    for (const [k, v] of Object.entries(raw)) if (k && v !== '') row[k] = v;
    if (Object.keys(row).length > 0) rows.push(row);
  }
  return rows;
}

export function requireColumns(tab: string, _rows: Row[], header: string[], required: string[]): Problem[] {
  return required.filter(c => !header.includes(c)).map(c => ({ tab, message: `missing column "${c}"` }));
}
