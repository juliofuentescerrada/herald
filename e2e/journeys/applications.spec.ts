import { createOrganisation, expect, test } from '../fixtures.ts';
import { pilotApplication } from '../environment.ts';

test('An owner grants a pilot application access to one tournament’s result operations, sees the grant listed, and revokes it', async ({
  page,
  signIn,
  expectAccessible,
}) => {
  await signIn();
  const organisation = await createOrganisation(page);
  for (const title of ['Saturday Open', 'Sunday Cup']) {
    await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
    await page.getByRole('link', { name: 'Create tournament' }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/tournaments\/[0-9a-f-]{36}$/);
  }

  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await expect(page.getByText('No application has access')).toBeVisible();
  await expectAccessible();

  await page.getByRole('button', { name: 'Grant access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Grant access' });
  await dialog.getByLabel('Name', { exact: true }).fill('Results bot');
  await dialog.getByLabel('Application identifier', { exact: true }).fill(pilotApplication.oid);
  await dialog.getByRole('radio', { name: 'Selected tournaments' }).check();
  await dialog.getByRole('checkbox', { name: 'Saturday Open' }).check();
  await dialog.getByRole('checkbox', { name: /^Read ·/ }).check();
  await dialog.getByRole('checkbox', { name: /^Results and corrections ·/ }).check();
  await expectAccessible();
  await dialog.getByRole('button', { name: 'Grant access' }).click();

  await expect(page.getByText('Results bot can act within its grant.')).toBeVisible();
  const grant = page.getByRole('listitem').filter({ hasText: 'Results bot' });
  await expect(grant.getByText('Active', { exact: true })).toBeVisible();
  await expect(grant.getByText(`${pilotApplication.oid} · Saturday Open`)).toBeVisible();
  await expect(grant.getByText('Results and corrections', { exact: true })).toBeVisible();
  await expect(grant).not.toContainText('Sunday Cup');

  await grant.getByRole('button', { name: 'Revoke: Results bot' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Revoke Results bot?' });
  await expect(confirmation.getByText(`Results bot stops acting for ${organisation.name} from its next request.`, { exact: false })).toBeVisible();
  await confirmation.getByRole('button', { name: 'Revoke' }).click();

  await expect(page.getByText('Results bot no longer has access.')).toBeVisible();
  await expect(grant.getByText('Revoked', { exact: true })).toBeVisible();
  await expect(grant.getByRole('button', { name: 'Revoke: Results bot' })).toHaveCount(0);
  await expectAccessible();
});
