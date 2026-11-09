import { urls } from '../environment.ts';
import { createOrganisation, expect, test } from '../fixtures.ts';

test('A signed-out person opening a deep link signs in and returns to that address', async ({ page, signIn, secondPage }) => {
  const persona = await signIn();
  const { id, name } = await createOrganisation(page);

  // A new tab has no session: the deep link goes through sign-in first.
  await signIn({ on: secondPage, as: persona, path: `/organisations/${id}/switch` });

  await expect(secondPage).toHaveURL(`${urls.admin}/organisations/${id}/switch`);
  await expect(secondPage.getByRole('heading', { name: 'Choose an organisation' })).toBeVisible();
  await expect(secondPage.getByText(name).first()).toBeVisible();
});

test('A person not assigned to Herald is shown that access is by invitation', async ({ page, signIn, expectAccessible }) => {
  await signIn({ assigned: false });

  await expect(page.getByRole('heading', { name: 'Herald access is by invitation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use another account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create another organisation' })).toHaveCount(0);
  await expectAccessible();
});
