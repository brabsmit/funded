import { describe, it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeContent } from '../../scripts/sync/write';
import { assemble } from '../../scripts/sync/assemble';
import { goodTabs } from './fixtures';

describe('writeContent', () => {
  it('writes one JSON per track and school and removes stale files', async () => {
    const root = await mkdtemp(join(tmpdir(), 'funded-'));
    await mkdir(join(root, 'src/content/schools'), { recursive: true });
    await writeFile(join(root, 'src/content/schools/stale.json'), '{}');
    const { tracks, schools } = assemble(goodTabs());
    const written = await writeContent(root, tracks, schools);
    expect(written.map(p => p.replace(root, ''))).toEqual(['/src/content/tracks/cip.json', '/src/content/schools/oakridge.json']);
    expect(await readdir(join(root, 'src/content/schools'))).toEqual(['oakridge.json']);
    const school = JSON.parse(await readFile(join(root, 'src/content/schools/oakridge.json'), 'utf8'));
    expect(school.needs[0].milestones[1].status).toBe('next');
  });
});
