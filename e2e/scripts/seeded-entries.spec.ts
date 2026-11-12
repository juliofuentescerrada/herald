import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// The first executable test script (harness-engineering 4.3): the seeded owner reviews a full field with a waiting
// queue and a team tournament's rosters, the way the maintainer would on a preview.
test(
  'The seeded owner finds a full field with its waiting queue, and team rosters by readiness',
  { annotation: { type: 'covers', description: "agent-harness: Checking a slice before the maintainer's test round" } },
  async ({ page, signIn }, info) => {
    // With two organisations, the owner lands on the chooser.
    await signIn({ as: scriptPersona });
    await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
    await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Winter Draft Cup' })).toBeVisible();
    await screen(page, info, 'tournaments-by-state');

    await page.getByRole('link', { name: 'Entries: Autumn League' }).click();
    await expect(page.getByRole('heading', { name: 'Entries · Autumn League' })).toBeVisible();
    await expect(page.getByText('Greta Lowe')).toBeVisible();
    await screen(page, info, 'full-field-with-waiting-queue');

    await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
    await page.getByRole('link', { name: 'Entries: Harbour Team League' }).click();
    await expect(page.getByRole('heading', { name: 'Entries · Harbour Team League' })).toBeVisible();
    await screen(page, info, 'team-rosters-by-readiness');
  },
);
