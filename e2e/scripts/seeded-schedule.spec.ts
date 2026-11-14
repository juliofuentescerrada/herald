import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-round-robin-pairings 7.3: on the seeded Lantern League (registration closed, mandatory check-in, one player
// pending), the owner reviews the absence, generates and publishes the schedule, withdraws it with a reason and
// publishes it again.
test('The seeded owner reviews an absence, publishes the schedule, withdraws it and publishes it again', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Entries: Lantern League' }).click();
  await expect(page.getByText('1 entry is pending check-in')).toBeVisible();
  await screen(page, info, 'absence-review');

  await page.getByRole('button', { name: 'Mark absent: Piers Galloway' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await screen(page, info, 'mark-absent-confirmation');
  await page.getByRole('dialog').getByRole('button', { name: 'Mark absent' }).click();
  await expect(page.getByText('Piers Galloway marked absent.')).toBeVisible();
  await page.getByText('Cancelled · 1').click();
  await screen(page, info, 'marked-absent');

  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await page.getByRole('link', { name: 'View schedule' }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Lantern League' })).toBeVisible();
  const draw = page.getByRole('radio', { name: 'Draw (the seed is recorded)' });
  await expect(async () => {
    await page.reload();
    await expect(draw).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await screen(page, info, 'schedule-before-generating');
  await draw.check();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await expect(page.getByRole('heading', { name: '4 players · 3 rounds · 6 matches' })).toBeVisible();
  await screen(page, info, 'draft');

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published · revision 1', { exact: true })).toBeVisible();
  await screen(page, info, 'published');

  await page.getByRole('button', { name: 'Withdraw' }).click();
  await page.getByLabel('Reason (required)').fill('A late arrival asked to play');
  await screen(page, info, 'withdraw-confirmation');
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByText('Revision 1 withdrawn.')).toBeVisible();
  await screen(page, info, 'withdrawn');

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published · revision 2', { exact: true })).toBeVisible();
  await screen(page, info, 'republished');

  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await expect(page.getByText('The schedule is published. Withdraw it before reopening registration.')).toBeVisible();
  await screen(page, info, 'reopening-locked');
});
