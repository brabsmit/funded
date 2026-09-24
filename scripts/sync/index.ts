import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseTab, parseHeader, requireColumns, type Problem } from './parse';
import { assemble, TAB_COLUMNS, type Tabs, type TabName } from './assemble';
import { readLocalTabs, fetchRemoteTabs, TAB_NAMES, type SyncConfig } from './fetch';
import { writeContent } from './write';

const root = resolve(import.meta.dirname, '../..');
const sheetDir = resolve(root, 'data/sheet');
const remote = process.argv.includes('--remote');

function print(label: string, problems: Problem[]) {
  if (problems.length === 0) return;
  console.log(`\n${label} (${problems.length}):`);
  for (const p of problems) console.log(`  ${p.tab}${p.row ? ` row ${p.row}` : ''}: ${p.message}`);
}

async function main() {
  let raw: Record<TabName, string>;
  if (remote) {
    const cfg = JSON.parse(await readFile(resolve(root, 'sync.config.json'), 'utf8')) as SyncConfig;
    raw = await fetchRemoteTabs(cfg, sheetDir);
    console.log(`Fetched ${TAB_NAMES.length} tabs into data/sheet/`);
  } else {
    raw = await readLocalTabs(sheetDir);
    console.log(`Read ${TAB_NAMES.length} tabs from data/sheet/`);
  }

  const errors: Problem[] = [];
  const tabs = {} as Tabs;
  for (const tab of TAB_NAMES) {
    errors.push(...requireColumns(tab, [], parseHeader(raw[tab]), TAB_COLUMNS[tab]));
    tabs[tab] = parseTab(raw[tab]);
  }
  if (errors.length) { print('Errors', errors); process.exit(1); }

  const result = assemble(tabs);
  print('Warnings', result.warnings);
  if (result.errors.length) { print('Errors', result.errors); console.log('\nNothing written.'); process.exit(1); }

  const written = await writeContent(root, result.tracks, result.schools);
  console.log(`\nWrote ${written.length} files:`);
  for (const p of written) console.log(`  ${p.replace(root + '/', '')}`);
  console.log('\nReview with: git diff --stat src/content');
}

main().catch(e => { console.error(e.message ?? e); process.exit(1); });
