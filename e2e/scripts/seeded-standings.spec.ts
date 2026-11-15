import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-standings 5.3: the seeded Harbour Cup has not started (seeded-start, which starts it, runs after this script), and on
// the seeded Lantern Open (Ada Fenwick beat Dario Venn, Dario Venn beat Bram Holloway, and seeded-results adds two more)
// Dario Venn shares a position. The owner reads the standings, one entrant's explanation and the narrow layout.
test('The seeded owner reads a league’s provisional standings, a shared position and an entrant’s explanation', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Harbour Cup' }).click();
  const tabs = page.getByRole('navigation', { name: 'Tournament sections' });
  await tabs.getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('Standings begin when the competition starts')).toBeVisible();
  await screen(page, info, 'before-start');

  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Open' }).click();
  await tabs.getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByRole('heading', { name: 'Standings · Lantern Open' })).toBeVisible();
  await expect(page.getByText(/^Provisional · \d of 6 matches resolved$/)).toBeVisible();
  const table = page.getByRole('table', { name: 'Standings' });
  await expect(table.getByText(/, shared$/).first()).toBeAttached();
  await screen(page, info, 'provisional-shared-position');

  await table.getByRole('button', { name: 'Dario Venn' }).click();
  await expect(page.getByText(/vs Ada Fenwick · lost · played · 0 points$/)).toBeVisible();
  await expect(page.getByText(/vs Bram Holloway · won · played · 3 points$/)).toBeVisible();
  await expect(page.getByText('Total: 3 points')).toBeVisible();
  await screen(page, info, 'explanation');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(table.getByRole('columnheader', { name: 'Won' })).toBeHidden();
  await expect(table.getByRole('columnheader', { name: 'Points' })).toBeVisible();
  await screen(page, info, 'narrow');
});
