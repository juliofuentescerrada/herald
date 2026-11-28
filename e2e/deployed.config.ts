import { defineConfig, devices } from '@playwright/test';

// The test script for a deployed slot (m4-deploy 5.3): no local servers and no seeding, since the slot's job seeds it.
// The maintainer signs in by hand in the opened browser, so no password reaches the script, a file or the agent.
const admin = process.env['HERALD_SLOT_ADMIN_URL'];
if (!admin) throw new Error('Set HERALD_SLOT_ADMIN_URL to the slot\'s admin address (the deployment comment names it).');

export default defineConfig({
  testDir: './scripts',
  testMatch: 'deployed-slot.spec.ts',
  workers: 1,
  timeout: 300_000,
  reporter: [['list']],
  outputDir: 'test-results/deployed',
  use: {
    baseURL: admin,
    headless: false,
    trace: 'off', // a trace would hold the directory's sign-in pages
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } }],
});
