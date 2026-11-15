import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-operator-results 4.3: on the seeded Lantern Open (running, four players, Ada Fenwick already beat Dario Venn and
// Dario Venn beat Bram Holloway),
// the owner records a win that starts and resolves its match in one step and a draw, and reads both on the schedule.
test('The seeded owner records a win and a draw and reads them on the schedule', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Open' }).click();
  await page.getByRole('link', { name: 'View schedule' }).click();
  await expect(page.getByText('Ada Fenwick won')).toBeVisible();

  await page.getByRole('link', { name: 'Bram Holloway vs Cleo Marsh' }).click();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await expect(page.getByText('This match has not started: recording a played result also starts it.')).toBeVisible();
  await screen(page, info, 'result-empty');

  await page.getByRole('radio', { name: 'Bram Holloway wins' }).check();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeEnabled();
  await screen(page, info, 'outcome-chosen');

  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Bram Holloway won · played')).toBeVisible();
  await screen(page, info, 'win-recorded');

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await page.getByRole('link', { name: 'Ada Fenwick vs Cleo Marsh' }).click();
  await page.getByRole('radio', { name: 'Draw' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Draw · played')).toBeVisible();
  await screen(page, info, 'draw-recorded');

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await expect(page.getByText('Bram Holloway won')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 2' }).getByText('Draw', { exact: true })).toBeVisible();
  await screen(page, info, 'schedule-with-results');
});
