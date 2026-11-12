import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-check-in 7.2: the seeded owner checks an entrant in and undoes it on a field where another entrant has already
// checked in, and finds the check-in policy locked by that check-in.
test('The seeded owner checks an entrant in, undoes it, and finds the check-in policy locked', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Entries: Autumn League' }).click();
  await expect(page.getByText('Check-in optional · 1 of 4 checked in')).toBeVisible();
  await screen(page, info, 'one-entrant-checked-in');

  const admitted = page.getByRole('list', { name: 'Admitted · 4' });
  await admitted.getByRole('button', { name: 'Check in: Cleo Marsh' }).click();
  await expect(page.getByText('Cleo Marsh checked in.')).toBeVisible();
  await expect(page.getByText('Check-in optional · 2 of 4 checked in')).toBeVisible();
  await screen(page, info, 'checked-in');

  await admitted.getByRole('button', { name: 'Undo check-in: Cleo Marsh' }).click();
  await expect(page.getByText('Cleo Marsh’s check-in undone.')).toBeVisible();
  await expect(page.getByText('Check-in optional · 1 of 4 checked in')).toBeVisible();
  await screen(page, info, 'check-in-undone');

  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await expect(page.getByLabel('Check-in', { exact: true })).toBeDisabled();
  await expect(page.getByText('Entries have checked in. Undo every check-in to change it.')).toBeVisible();
  await page.getByLabel('Check-in', { exact: true }).scrollIntoViewIfNeeded();
  await screen(page, info, 'check-in-policy-locked');
});
