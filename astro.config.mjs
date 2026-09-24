// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://brabsmit.github.io',
  base: '/funded',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
