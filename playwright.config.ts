import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {},
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.spec\.ts$/,
    },
  ],
});
