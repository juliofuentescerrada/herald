import { defineConfig, devices } from '@playwright/test';
import { urls } from './environment.ts';
import { webServer } from './servers.ts';

const ci = !!process.env['CI'];

export default defineConfig({
  testDir: './journeys',
  fullyParallel: true,
  forbidOnly: ci,
  // One retry in CI only; the report lists a retried pass as flaky, so it stays visible (design E-7).
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: urls.admin,
    // The provider serves TLS with a certificate it generates.
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer,
});
