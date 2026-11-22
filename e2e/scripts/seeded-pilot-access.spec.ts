import { expect, test } from '../fixtures.ts';
import { pilotApplication, scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-pilot-access 4.3: the seeded owner finds no application in an empty organisation, fills the grant dialog, reads the
// seeded grants of Beacon Street Gamers and is asked before revoking one. Nothing is granted or revoked, so seeds stay as they are.
test('The seeded owner reviews pilot application access and is asked before revoking it', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Harbour Games Club' }).click();
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await expect(page.getByText('No application has access')).toBeVisible();
  await screen(page, info, 'empty-page');

  await page.getByRole('button', { name: 'Grant access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Grant access' });
  await dialog.getByLabel('Name', { exact: true }).fill('Results bot');
  await dialog.getByLabel('Application identifier', { exact: true }).fill(pilotApplication.oid);
  await dialog.getByRole('checkbox', { name: /^Read ·/ }).check();
  await dialog.getByRole('checkbox', { name: /^Results and corrections ·/ }).check();
  await screen(page, info, 'grant-dialog');
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('link', { name: 'Switch organisation' }).click();
  await page.getByRole('button', { name: 'Switch to Beacon Street Gamers' }).click();
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  const bot = page.getByRole('listitem').filter({ hasText: 'Results bot' });
  await expect(bot.getByText('Beacon Saturday Open')).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Old scoreboard' }).getByText('Revoked', { exact: true })).toBeVisible();
  await screen(page, info, 'grant-list');

  await bot.getByRole('button', { name: 'Revoke: Results bot' }).click();
  await expect(page.getByRole('dialog', { name: 'Revoke Results bot?' })).toBeVisible();
  await screen(page, info, 'revoke-confirmation');
  await page.getByRole('button', { name: 'Keep access' }).click();
  await expect(bot.getByText('Active', { exact: true })).toBeVisible();
});
