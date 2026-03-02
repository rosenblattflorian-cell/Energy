import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests',
  webServer: {
    command: 'pnpm --filter @energy/web dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3000'
  }
});
