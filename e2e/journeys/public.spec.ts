import { urls } from '../environment.ts';
import { expect, test } from '../fixtures.ts';

test('A visitor on the public page follows Sign in to the admin application', async ({ page, signIn, expectAccessible }) => {
  await page.goto(urls.public);
  await expectAccessible();

  await page.getByRole('link', { name: 'Sign in' }).click();
  await signIn({ path: null });

  await expect(page).toHaveURL(`${urls.admin}/organisations/new`);
  await expect(page.getByRole('heading', { name: 'Create an organisation' })).toBeVisible();
});
