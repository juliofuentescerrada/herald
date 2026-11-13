import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// ui-icons 4.1: the seeded owner sees icons in the rail, the lifecycle and check-in labels, the back and entries
// links and an empty panel. The icons are decorative, so the steps check them by name beside their unchanged text.
test('The seeded owner finds icons beside the navigation, statuses, links and empty panels', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Harbour Games Club' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No tournaments yet' })).toBeVisible();
  await expect(page.locator('main [data-icon="trophy"]')).toBeVisible();
  await screen(page, info, 'empty-list');

  await page.getByRole('link', { name: 'Switch organisation' }).click();
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Tournaments', exact: true }).locator('[data-icon="trophy"]')).toBeVisible();
  await expect(page.locator('herald-status-label', { hasText: 'Draft' }).first().locator('[data-icon="pencil"]')).toBeVisible();
  await screen(page, info, 'tournament-list');

  await page.getByRole('link', { name: 'Entries: Autumn League' }).click();
  await expect(page.getByRole('link', { name: 'Back to configuration' }).locator('[data-icon="arrow-left"]')).toBeVisible();
  await expect(page.locator('herald-status-label', { hasText: 'Checked in' }).first().locator('[data-icon="circle-check"]')).toBeVisible();
  await screen(page, info, 'entries-with-check-in');
});
