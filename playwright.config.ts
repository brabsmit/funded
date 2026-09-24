import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/funded/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4321/funded/' },
  projects: [
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
  ],
});
