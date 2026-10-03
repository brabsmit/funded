// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

/** Pre-district URLs (used in the pitch video and early links) redirect into the district they belong to.
 *  Built from the synced content so a new school gets its redirect for free. Drop once the video is re-cut. */
const BASE = '/funded';

function legacyRedirects() {
  /** @param {string} dir */
  const readJson = dir => readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  const districts = readJson('./src/content/districts');
  const schools = readJson('./src/content/schools');
  /** @type {Record<string, string>} */
  const out = {};
  // Astro does not prepend `base` to redirect destinations, so spell it out.
  if (districts.length === 1) out['/tracks'] = `${BASE}/${districts[0].id}/tracks/`;
  for (const s of schools) out[`/schools/${s.id}`] = `${BASE}/${s.district_id}/schools/${s.id}/`;
  return out;
}

export default defineConfig({
  site: 'https://brabsmit.github.io',
  base: BASE,
  trailingSlash: 'always',
  // Pre-district URLs (used in the pitch video and early links) land on the pilot district.
  // Drop these once a second district exists and the video is re-cut.
  redirects: legacyRedirects(),
  vite: { plugins: [tailwindcss()] },
});
