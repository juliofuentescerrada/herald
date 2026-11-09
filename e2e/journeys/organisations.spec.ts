import { urls } from '../environment.ts';
import { createOrganisation, expect, test, uniqueName } from '../fixtures.ts';

test('A newcomer creates an organisation and lands in its workspace', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await expect(page.getByRole('heading', { name: 'Create an organisation' })).toBeVisible();
  await expectAccessible();

  const { name } = await createOrganisation(page);

  await expect(page.getByText('Organisation created')).toBeVisible();
  await expect(page.getByText(`You are now the only owner of ${name}.`)).toBeVisible();
  await expect(page.getByRole('complementary').getByText(name)).toBeVisible();
  await expectAccessible();
});

test('An owner of two organisations switches, and another tab reloads into its own organisation', async ({ page, secondPage, signIn, expectAccessible }) => {
  const persona = await signIn();
  const first = await createOrganisation(page);
  await page.getByRole('link', { name: 'Create another organisation' }).click();
  const second = await createOrganisation(page);
  await signIn({ on: secondPage, as: persona, path: `/organisations/${second.id}` });
  // The tab listens for replacements once its workspace is up; a switch before that has nobody to tell.
  await expect(secondPage.getByRole('complementary').getByText(second.name)).toBeVisible();

  await page.getByRole('link', { name: 'Switch organisation' }).click();
  await expectAccessible();
  await page.getByRole('button', { name: `Switch to ${first.name}` }).click();

  await expect(page).toHaveURL(`${urls.admin}/organisations/${first.id}`);
  await expect(page.getByRole('complementary').getByText(first.name)).toBeVisible();
  await expect(secondPage.getByText(`You are now working in ${second.name}.`)).toBeVisible();
  await expect(secondPage).toHaveURL(`${urls.admin}/organisations/${second.id}`);
  await expectAccessible(secondPage);
});

test('Leaving the creation form with typed input asks first, and declining keeps it', async ({ page, signIn }) => {
  await signIn();
  const name = uniqueName();
  await page.getByLabel('Organisation name').fill(name);

  let asked = '';
  page.once('dialog', (dialog) => {
    asked = dialog.message();
    void dialog.dismiss();
  });
  await page.getByRole('link', { name: 'HERALD' }).click();

  expect(asked).toBe('Discard your unsaved input? It is not saved anywhere.');
  await expect(page).toHaveURL(`${urls.admin}/organisations/new`);
  await expect(page.getByLabel('Organisation name')).toHaveValue(name);
});
