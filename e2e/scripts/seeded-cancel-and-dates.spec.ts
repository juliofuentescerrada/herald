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

const openTournament = async (page: Page, title: string) => {
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(`^(Edit configuration|Continue draft): ${title}$`) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
};

const section = async (page: Page, name: string) => {
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
};

// h1-tournament-cancel-and-dates 5.3 on the seeded Lantern Hall Players: the dates preview on Spring Open (not saved), the cancel
// confirmations, Lantern Spire cancelled with its matches voided, Lantern Mast archived and the list with "Show archived".
test('The seeded owner previews a date change, cancels a running league, sees its voided matches and archives a cancelled one', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();

  // Change dates before start: the dialog, its preview and a refused order. Nothing is saved.
  await openTournament(page, 'Spring Open');
  await page.getByRole('button', { name: 'Change dates' }).click();
  const dates = page.getByRole('dialog', { name: 'Change dates' });
  await expect(dates.getByRole('checkbox', { name: 'Planned start' })).toBeVisible();
  await both(page, info, 'dates-dialog');
  await dates.getByRole('checkbox', { name: 'Registration closes' }).check();
  await dates.getByRole('checkbox', { name: 'Planned start' }).check();
  const start = dates.getByLabel('New planned start');
  const postponed = (await start.inputValue()).slice(0, 10);
  await start.fill(`${postponed}T12:00`);
  await expect(dates.getByText(/^Planned start: .* → .*12:00$/)).toBeVisible();
  await both(page, info, 'dates-preview');
  await page.route('**/dates', (route) =>
    route.fulfill({ status: 400, contentType: 'application/problem+json', body: JSON.stringify({ status: 400, errors: { registrationClosesAt: ['after-planned-start'] } }) }));
  await dates.getByRole('button', { name: 'Save dates' }).click();
  await expect(dates.getByText('Registration closes after the planned start.', { exact: false })).toBeVisible();
  await both(page, info, 'dates-invalid');
  await page.unroute('**/dates');
  await dates.getByRole('button', { name: 'Keep as it is' }).click();

  // Cancel before start: the consequence in words, then kept.
  await page.getByRole('button', { name: 'Cancel tournament' }).click();
  const before = page.getByRole('dialog', { name: 'Cancel Spring Open?' });
  await expect(before.getByText('Registration closes.', { exact: false })).toBeVisible();
  await both(page, info, 'cancel-before-start');
  await before.getByRole('button', { name: 'Keep the tournament' }).click();

  // A running league: dates are fixed; cancelling names the results that stay and the matches voided.
  await openTournament(page, 'Lantern Spire');
  await expect(page.getByText('The dates are fixed now the competition has started.')).toBeVisible();
  await both(page, info, 'dates-after-start');
  await page.getByRole('button', { name: 'Cancel tournament' }).click();
  const after = page.getByRole('dialog', { name: 'Cancel Lantern Spire?' });
  await expect(after.getByText('4 results recorded so far stay. 2 unresolved matches will be voided with no points.', { exact: false })).toBeVisible();
  await after.getByRole('textbox', { name: 'Reason (required)' }).fill('Venue flooded');
  await both(page, info, 'cancel-after-start');
  await after.getByRole('button', { name: 'Cancel tournament' }).click();
  await expect(page.getByText('Lantern Spire cancelled.')).toBeVisible();
  await expect(page.getByText('This tournament is cancelled', { exact: true })).toBeVisible();
  await both(page, info, 'cancelled');

  // Competition voids the matches from the event, milliseconds after the write.
  await section(page, 'Schedule');
  await expect(async () => {
    await page.reload();
    await expect(page.getByText('Voided: tournament cancelled · no points')).toHaveCount(2, { timeout: 1_000 });
  }).toPass();
  await both(page, info, 'schedule-cancelled');
  await section(page, 'Standings');
  await expect(page.getByText('Cancelled · no champion or final ranking')).toBeVisible();
  await both(page, info, 'standings-cancelled');

  // Archiving the seeded cancelled Lantern Mast hides it from the list until "Show archived".
  await openTournament(page, 'Lantern Mast');
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Lantern Mast archived.', { exact: false })).toBeVisible();
  await both(page, info, 'archive-ready');
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lantern Spire' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lantern Mast' })).toHaveCount(0);
  await both(page, info, 'list-archived-hidden');
  await page.getByRole('checkbox', { name: 'Show archived' }).check();
  await expect(page.getByRole('heading', { name: 'Lantern Urn' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lantern Mast' })).toBeVisible();
  await both(page, info, 'list-archived-shown');

  // Deleting a draft asks first; the script keeps it.
  await page.getByRole('checkbox', { name: 'Show archived' }).uncheck();
  await openTournament(page, 'Winter Draft Cup');
  await page.getByRole('button', { name: 'Delete draft' }).click();
  const deletion = page.getByRole('dialog', { name: 'Delete Winter Draft Cup?' });
  await expect(deletion.getByText('This draft was never published.', { exact: false })).toBeVisible();
  await both(page, info, 'delete-draft');
  await deletion.getByRole('button', { name: 'Keep the draft' }).click();
});
