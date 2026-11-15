import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

const used: string[] = [];

/**
 * Opens the first match still to play that this script has not used, and returns its two entrants, read from its link
 * ("View match: A vs B"). Skipping used matches covers the schedule's cached rows shown just after returning to it.
 */
const openNextMatch = async (page: Page): Promise<[string, string]> => {
  const rows = page.locator('li.running').filter({ hasText: 'Scheduled' });
  await expect(rows.first()).toBeVisible();
  const names = await rows.getByRole('link', { name: /^View match: / }).evaluateAll((links) => links.map((link) => link.getAttribute('aria-label') ?? link.textContent ?? ''));
  const name = names.map((each) => each.replace(/\s+/g, ' ').trim()).find((each) => !used.includes(each))!;
  used.push(name);
  const link = page.getByRole('link', { name, exact: true });
  const [first, second] = name.replace('View match: ', '').split(' vs ');
  await link.click();
  await expect(page.getByRole('heading', { name: new RegExp(`${first} vs ${second}`) })).toBeVisible();
  return [first, second];
};

// h1-exceptional-outcomes 4.3: on the seeded Lantern Shield (running, six players, one match of each cause already recorded),
// the owner records a concession before play, a double absence and a no contest with its reason, and reads each cause on the schedule.
test('The seeded owner records a concession, a double absence and a no contest and reads them on the schedule', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Shield' }).click();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByText('No contest: Venue closed · 0 each · no play recorded')).toBeVisible();
  const back = () => page.getByRole('link', { name: 'Back to schedule' }).first().click();

  const [winner, conceding] = await openNextMatch(page);
  await page.getByRole('radio', { name: 'Concession' }).check();
  await page.getByRole('group', { name: 'Who conceded?' }).getByRole('radio', { name: conceding }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeEnabled();
  await screen(page, info, 'concession-chosen');

  await page.getByRole('button', { name: 'Record result' }).click();
  const conceded = `${conceding} conceded before play · ${winner} wins · no play recorded`;
  await expect(page.getByText(conceded)).toBeVisible();
  await screen(page, info, 'conceded-before-play');

  await back();
  await openNextMatch(page);
  await page.getByRole('radio', { name: 'Absence' }).check();
  await page.getByRole('radio', { name: 'Both were absent' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Both were absent · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'double-absence');

  await back();
  await openNextMatch(page);
  await page.getByRole('radio', { name: 'No contest' }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await expect(page.getByText('A no contest needs a reason.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await screen(page, info, 'no-contest-missing-reason');

  await page.getByRole('textbox', { name: 'Reason (required)' }).fill('Floodlights failed');
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('No contest: Floodlights failed · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'no-contest-recorded');

  await back();
  await expect(page.getByText(conceded)).toBeVisible();
  await expect(page.getByText('Both were absent · 0 each · no play recorded')).toHaveCount(2);
  await expect(page.getByText('No contest: Floodlights failed · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'schedule-with-causes');
});
