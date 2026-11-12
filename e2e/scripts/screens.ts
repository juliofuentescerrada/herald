import type { Page, TestInfo } from '@playwright/test';
import { basename } from 'node:path';

/**
 * Saves a numbered full-page screenshot of a step to test-results/screens/<script>/, which CI uploads for the
 * pull request (harness-engineering D-14).
 */
export const screen = async (page: Page, info: TestInfo, step: string): Promise<void> => {
  const index = String(info.attachments.length + 1).padStart(2, '0');
  const path = `test-results/screens/${basename(info.file, '.spec.ts')}/${index}-${step}.png`;
  await info.attach(`${index}-${step}`, { body: await page.screenshot({ path, fullPage: true }), contentType: 'image/png' });
};
