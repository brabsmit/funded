import Papa from 'papaparse';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { goodTabs } from '../../tests/sync/fixtures';
import { TAB_COLUMNS, type TabName } from '../sync/assemble';

const dir = resolve(import.meta.dirname, '../../data/sheet');
for (const [tab, rows] of Object.entries(goodTabs()) as Array<[TabName, Record<string, string>[]]>) {
  writeFileSync(resolve(dir, `${tab}.csv`), Papa.unparse(rows, { columns: TAB_COLUMNS[tab] }) + '\n');
}
console.log('wrote fixture CSVs to data/sheet/');
