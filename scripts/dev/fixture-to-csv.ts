// for smoke-testing the sync CLI; never writes to data/sheet.
import Papa from 'papaparse';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { goodTabs } from '../../tests/sync/fixtures';
import { TAB_COLUMNS, type TabName } from '../sync/assemble';

const dir = resolve(tmpdir(), `funded-fixture-${Date.now()}`);
mkdirSync(dir, { recursive: true });
for (const [tab, rows] of Object.entries(goodTabs()) as Array<[TabName, Record<string, string>[]]>) {
  writeFileSync(resolve(dir, `${tab}.csv`), Papa.unparse(rows, { columns: TAB_COLUMNS[tab] }) + '\n');
}
console.log(`wrote fixture CSVs to ${dir}`);
