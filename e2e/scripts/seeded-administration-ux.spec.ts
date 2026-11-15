import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';


test('The seeded owner navigates and protects lineup work', { annotation: [{ type: 'covers', description: 'tournament-administration-ux: Owner moves from a running list record to its schedule' }, { type: 'covers', description: 'tournament-administration-ux: Owner inspects a running tournament' }, { type: 'covers', description: 'tournament-administration-ux: Owner leaves an edited lineup' }, { type: 'covers', description: 'tournament-administration-ux: Owner uses the desktop breakpoint with the workspace rail' }] }, async ({ page, signIn, expectAccessible }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('link', { name: 'View schedule: Saltmarsh Team League', exact: true })).toBeVisible();
  for (const width of [320, 390, 699, 700, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await screen(page, info, `list-${width}`);
  }
  await expectAccessible();
  const title = page.locator('main h2').first();
  const originalTitle = await title.textContent();
  await title.evaluate(element => { element.textContent = 'The Lantern Hall Players annual tournament with a very long descriptive title '.repeat(3); });
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await screen(page, info, 'long-title-320');
  await title.evaluate((element, text) => { element.textContent = text; }, originalTitle);
  await page.setViewportSize({ width: 1440, height: 900 });
  const scheduleLink = page.getByRole('link', { name: 'View schedule: Saltmarsh Team League', exact: true });
  await scheduleLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Tournament sections' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View match: Granite Herons vs Saltmarsh Wolves', exact: true })).toBeVisible();
  await screen(page, info, 'schedule');
  await expectAccessible();
  await page.getByRole('link', { name: 'View match: Granite Herons vs Saltmarsh Wolves', exact: true }).click();
  const first = page.getByRole('region', { name: 'Granite Herons · lineup', exact: true });
  // The match page renders its heading once loaded; checking before that reports a missing h1.
  await expect(page.getByRole('heading', { level: 1, name: 'Match · Saltmarsh Team League' })).toBeVisible();
  await expect(first).toBeVisible();
  await expectAccessible();
  await first.getByRole('checkbox', { name: 'Ada Fenwick', exact: true }).check();
  await page.getByRole('link', { name: 'Back to schedule', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Leave without saving your changes?' })).toBeVisible();
  await screen(page, info, 'unsaved-lineup');
  await expectAccessible();
  await page.keyboard.press('Escape');
  await expect(first.getByRole('checkbox', { name: 'Ada Fenwick', exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Back to schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Leave without saving', exact: true }).click();
  await page.getByRole('link', { name: 'Configuration', exact: true }).click();
  await expect(page.getByLabel('Capacity in teams', { exact: true })).toHaveAttribute('readonly');
  await screen(page, info, 'running-configuration');
});

test('The seeded owner retries a search without changing the name and reads collapsed publication history', { annotation: [{ type: 'covers', description: 'tournament-administration-ux: A guest search fails for a valid name' }, { type: 'covers', description: 'tournament-administration-ux: Owner returns pairings to a draft' }] }, async ({ page, signIn, expectAccessible }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Entries: Autumn League', exact: true }).click();
  await expect(page.getByRole('list', { name: /^Admitted ·/ })).toBeVisible();
  for (const width of [320, 390, 699, 700, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await screen(page, info, `entries-${width}`);
  }
  await expectAccessible();
  await page.getByRole('button', { name: 'Add player', exact: true }).click();
  let requests = 0;
  await page.route('**/guests?*', async route => {
    if (++requests === 1) await route.fulfill({ status: 503, body: '{}' });
    else await route.continue();
  });
  await page.getByRole('textbox', { name: 'Search by name', exact: true }).fill('Gre');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await screen(page, info, 'search-failure');
  await expectAccessible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search by name', exact: true })).toHaveValue('Gre');
  await expect(page.getByRole('heading', { name: 'Greta Lowe', exact: true })).toBeVisible();
  expect(requests).toBe(2);
  await screen(page, info, 'search-recovered');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Add player', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'View schedule: Midsummer Classic', exact: true }).click();
  await page.getByRole('radio', { name: 'Admission order', exact: true }).check();
  await page.getByRole('button', { name: 'Generate draft', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await page.getByRole('textbox', { name: 'Reason (required)', exact: true }).fill('Review attendance');
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  await expect(page.locator('details.history')).not.toHaveAttribute('open');
  await screen(page, info, 'withdrawn-history-collapsed');
});
