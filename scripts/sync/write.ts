import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DistrictT, TrackT, SchoolT } from '../../src/schema/records';

async function resetDir(dir: string) {
  await mkdir(dir, { recursive: true });
  for (const f of await readdir(dir)) if (f.endsWith('.json')) await rm(join(dir, f));
}

export async function writeContent(root: string, districts: DistrictT[], tracks: TrackT[], schools: SchoolT[]): Promise<string[]> {
  const districtsDir = join(root, 'src/content/districts');
  const tracksDir = join(root, 'src/content/tracks');
  const schoolsDir = join(root, 'src/content/schools');
  await resetDir(districtsDir);
  await resetDir(tracksDir);
  await resetDir(schoolsDir);
  const written: string[] = [];
  for (const d of districts) {
    const p = join(districtsDir, `${d.id}.json`);
    await writeFile(p, JSON.stringify(d, null, 2) + '\n');
    written.push(p);
  }
  for (const t of tracks) {
    const p = join(tracksDir, `${t.id}.json`);
    await writeFile(p, JSON.stringify(t, null, 2) + '\n');
    written.push(p);
  }
  for (const s of schools) {
    const p = join(schoolsDir, `${s.id}.json`);
    await writeFile(p, JSON.stringify(s, null, 2) + '\n');
    written.push(p);
  }
  return written;
}
