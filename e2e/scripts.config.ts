import { defineConfig, devices } from '@playwright/test';
import { urls } from './environment.ts';
import { webServer } from './servers.ts';

// A slice's executable test script: the steps the maintainer will take in the test round (locally until M4, then on its preview), run by the agent first
// against the local application with seeded data, with a screenshot at each step (harness-engineering D-14).
// Not journeys: they are not part of the post-merge suite unless promoted to journeys/.
export default defineConfig({
  testDir: './scripts',
  globalSetup: './scripts/seed.ts',
  workers: 1,
  reporter: [['list']],
  outputDir: 'test-results/scripts',
  use: {
    baseURL: urls.admin,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        // A machine whose preinstalled browser does not match the pinned Playwright names it (cloud sessions).
        launchOptions: process.env['HERALD_CHROMIUM'] ? { executablePath: process.env['HERALD_CHROMIUM'] } : {},
      },
    },
  ],
  webServer,
});
