import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

/** The same step at 1440 and 390 px, the widths the design compares with the prototypes (task 6.3). */
const both = async (page: Page, info: TestInfo, name: string) => {
  await screen(page, info, name);
  await page.setViewportSize({ width: 390, height: 844 });
  await screen(page, info, `${name}-390`);
  await page.setViewportSize({ width: 1440, height: 900 });
};

const changeLog = async (page: Page) => {
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Change log' }).click();
  await expect(page.getByRole('heading', { name: 'Change log · Lantern Beacon' })).toBeVisible();
};

// It cancels Lantern Beacon for good, so it runs once per seeded database: seed again before a second run.
// h1-change-log 5.3 on the seeded Lantern Hall Players: Lantern Beacon's populated log with its postponed start, the Schedule filter,
// then the cancellation and the entries it cancelled.
test('The seeded owner reads a populated change log, filters it by schedule, and sees a cancellation recorded with its entries', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Beacon' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lantern Beacon');

  // The populated log, newest first: the schedule republished, its withdrawal, the dates change with old and new times, four admissions.
  await changeLog(page);
  const log = page.getByRole('list');
  await expect(log.getByText('Schedule revision 2 published')).toBeVisible();
  await expect(log.getByText(/Planned start changed from .* to .* · Europe\/Madrid/)).toBeVisible();
  await expect(log.getByText(/admitted$/)).toHaveCount(4);
  await both(page, info, 'log-populated');

  // Filtered by Schedule: two publications and the withdrawal, which links to its reason.
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(log.getByRole('listitem')).toHaveCount(3);
  await expect(log.getByRole('link', { name: 'withdrawal reason in the publication history' })).toBeVisible();
  await both(page, info, 'log-filtered');

  // Filtered by Tournament: the publication and the postponed start, both public.
  await page.getByRole('button', { name: 'Tournament', exact: true }).click();
  await expect(log.getByRole('listitem')).toHaveCount(2);
  await both(page, info, 'log-dates-change');

  // The cancellation, with its reason, and the entries it cancelled once Registration has reported them.
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Configuration' }).click();
  await page.getByRole('button', { name: 'Cancel tournament' }).click();
  const cancel = page.getByRole('dialog', { name: 'Cancel Lantern Beacon?' });
  await cancel.getByRole('textbox', { name: 'Reason (required)' }).fill('Venue unavailable');
  await cancel.getByRole('button', { name: 'Cancel tournament' }).click();
  await expect(page.getByText('Lantern Beacon cancelled.')).toBeVisible();
  await changeLog(page);
  await expect(async () => {
    await page.reload();
    await expect(log.getByText('cancelled · tournament cancelled')).toHaveCount(4, { timeout: 1_000 });
    await expect(log.getByText('Schedule revision 2 withdrawn · tournament cancelled')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(log.getByText('Tournament cancelled · Reason: Venue unavailable')).toBeVisible();
  await both(page, info, 'log-cancelled');
});
