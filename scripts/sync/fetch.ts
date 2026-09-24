import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TabName } from './assemble';

export const TAB_NAMES: TabName[] = ['Tracks', 'Stages', 'Schools', 'Needs', 'Milestones', 'Engage', 'Inquiries', 'Sources'];
export type SyncConfig = { publishedCsvBase: string; gids: Record<TabName, number> };

export async function readLocalTabs(dir: string): Promise<Record<TabName, string>> {
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) out[tab] = await readFile(join(dir, `${tab}.csv`), 'utf8');
  return out;
}

export async function fetchRemoteTabs(cfg: SyncConfig, saveDir?: string): Promise<Record<TabName, string>> {
  if (!cfg.publishedCsvBase) throw new Error('sync.config.json: publishedCsvBase is empty. Publish the Sheet to the web first, or run npm run sync:local.');
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) {
    const url = `${cfg.publishedCsvBase}?gid=${cfg.gids[tab]}&single=true&output=csv`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${tab}: HTTP ${res.status} fetching ${url}`);
    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error(`${tab}: got HTML instead of CSV. Is the sheet published to the web and is gid ${cfg.gids[tab]} correct?`);
    out[tab] = text;
    if (saveDir) await writeFile(join(saveDir, `${tab}.csv`), text);
  }
  return out;
}
