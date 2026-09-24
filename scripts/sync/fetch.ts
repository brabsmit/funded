import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TabName } from './assemble';

export const TAB_NAMES: TabName[] = ['Tracks', 'Stages', 'Schools', 'Needs', 'Milestones', 'Engage', 'Inquiries', 'Sources'];

/**
 * Two ways to reach the Sheet:
 * - `sheetId`: the id from the Sheet's URL. Needs "Anyone with the link: Viewer" sharing.
 *   Tabs are fetched by name, so no gids. Preferred.
 * - `publishedCsvBase` + `gids`: File > Share > Publish to web as CSV. Fallback.
 */
export type SyncConfig = {
  sheetId?: string;
  publishedCsvBase?: string;
  gids?: Partial<Record<TabName, number>>;
};

export function tabUrl(cfg: SyncConfig, tab: TabName): string {
  if (cfg.sheetId) {
    return `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  }
  if (cfg.publishedCsvBase) {
    const gid = cfg.gids?.[tab];
    if (gid === undefined) throw new Error(`sync.config.json: gids.${tab} is missing.`);
    return `${cfg.publishedCsvBase}?gid=${gid}&single=true&output=csv`;
  }
  throw new Error('sync.config.json: set sheetId (preferred) or publishedCsvBase + gids, or run npm run sync:local.');
}

export async function readLocalTabs(dir: string): Promise<Record<TabName, string>> {
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) out[tab] = await readFile(join(dir, `${tab}.csv`), 'utf8');
  return out;
}

export async function fetchRemoteTabs(cfg: SyncConfig, saveDir?: string): Promise<Record<TabName, string>> {
  const out = {} as Record<TabName, string>;
  for (const tab of TAB_NAMES) {
    const url = tabUrl(cfg, tab);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${tab}: HTTP ${res.status} fetching ${url}. Is the Sheet shared as "Anyone with the link"?`);
    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error(`${tab}: got HTML instead of CSV. Is the Sheet shared as "Anyone with the link", and is there a tab named "${tab}"?`);
    out[tab] = text;
    if (saveDir) await writeFile(join(saveDir, `${tab}.csv`), text);
  }
  return out;
}
