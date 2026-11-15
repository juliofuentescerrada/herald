import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-operator-results 4.3: on the seeded Lantern Open (running, four players, Ada Fenwick already beat Dario Venn),
// the owner records a win that starts and resolves its match in one step and a draw, and reads both on the schedule.
test('The seeded owner records a win and a draw and reads them on the schedule', { annotation: [{ type: 'covers', description: 'tournament-administration-ux: Owner scans resolved and unresolved matches' }] }, async ({ page, signIn, expectAccessible }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Open' }).click();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByText('Ada Fenwick won')).toBeVisible();

  await page.getByRole('link', { name: 'View match: Bram Holloway vs Cleo Marsh' }).click();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await expect(page.getByText('This match has not started: recording a played result also starts it.')).toBeVisible();
  await screen(page, info, 'result-empty');
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await screen(page, info, 'result-empty-390');
  await page.setViewportSize({ width: 1440, height: 900 });

  await expectAccessible();
  await page.getByRole('radio', { name: 'Bram Holloway wins' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: 'Bram Holloway wins' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeEnabled();
  await screen(page, info, 'outcome-chosen');

  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Bram Holloway won · played')).toBeVisible();
  await screen(page, info, 'win-recorded');

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await page.getByRole('link', { name: 'View match: Ada Fenwick vs Cleo Marsh' }).click();
  await page.getByRole('radio', { name: 'Draw' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Draw · played')).toBeVisible();
  await screen(page, info, 'draw-recorded');

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await expect(page.getByText('Bram Holloway won')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 2' }).getByText('Draw', { exact: true })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 3', exact: true }).getByText('Scheduled', { exact: true })).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'View match: Ada Fenwick vs Bram Holloway', exact: true })).toBeVisible();
  const winRow = page.locator('li.running').filter({ has: page.getByRole('link', { name: 'View match: Bram Holloway vs Cleo Marsh', exact: true }) });
  await expect(winRow.getByText('Bram Holloway won', { exact: true })).toBeVisible();
  await expect(winRow.getByText('Resolved', { exact: true })).toBeVisible();
  await screen(page, info, 'schedule-with-results');
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await screen(page, info, 'schedule-with-results-390');
});
