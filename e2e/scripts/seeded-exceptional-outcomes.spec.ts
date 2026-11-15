import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

const pair = (a: string, b: string) => new RegExp(`^(${a} vs ${b}|${b} vs ${a})$`);

// h1-exceptional-outcomes 4.3: on the seeded Lantern Open (running, four players), the owner records a concession before play,
// a double absence and a no contest with its reason on the three matches the results script leaves, and reads each cause on the schedule.
test('The seeded owner records a concession, a double absence and a no contest and reads them on the schedule', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Open' }).click();
  await page.getByRole('link', { name: 'View schedule' }).click();
  const back = () => page.getByRole('link', { name: 'Back to schedule' }).first().click();

  await page.getByRole('link', { name: pair('Ada Fenwick', 'Bram Holloway') }).click();
  await page.getByRole('radio', { name: 'Concession' }).check();
  await page.getByRole('group', { name: 'Who conceded?' }).getByRole('radio', { name: 'Bram Holloway' }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeEnabled();
  await screen(page, info, 'concession-chosen');

  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Bram Holloway conceded before play · Ada Fenwick wins · no play recorded')).toBeVisible();
  await screen(page, info, 'conceded-before-play');

  await back();
  await page.getByRole('link', { name: pair('Bram Holloway', 'Dario Venn') }).click();
  await page.getByRole('radio', { name: 'Absence' }).check();
  await page.getByRole('radio', { name: 'Both were absent' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Both were absent · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'double-absence');

  await back();
  await page.getByRole('link', { name: pair('Cleo Marsh', 'Dario Venn') }).click();
  await page.getByRole('radio', { name: 'No contest' }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await expect(page.getByText('A no contest needs a reason.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await screen(page, info, 'no-contest-missing-reason');

  await page.getByRole('textbox', { name: 'Reason (required)' }).fill('Venue closed');
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('No contest: Venue closed · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'no-contest-recorded');

  await back();
  await expect(page.getByText('Bram Holloway conceded before play · Ada Fenwick wins · no play recorded')).toBeVisible();
  await expect(page.getByText('Both were absent · 0 each · no play recorded')).toBeVisible();
  await expect(page.getByText('No contest: Venue closed · 0 each · no play recorded')).toBeVisible();
  await screen(page, info, 'schedule-with-causes');
});
