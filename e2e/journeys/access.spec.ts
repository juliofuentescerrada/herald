import { authority, urls } from '../environment.ts';
import { createOrganisation, expect, test, uniqueName } from '../fixtures.ts';

test('Another owner’s organisation shows the generic denial with nothing of it', async ({ browser, page, signIn, expectAccessible }) => {
  const owner = await browser.newContext();
  const ownerPage = await owner.newPage();
  await signIn({ on: ownerPage });
  const theirs = await createOrganisation(ownerPage);
  await owner.close();

  await signIn({ path: `/organisations/${theirs.id}` });

  await expect(page.getByRole('heading', { name: 'This page is unavailable' })).toBeVisible();
  await expect(page.getByText(theirs.name)).toHaveCount(0);
  await expectAccessible();
});

test('A session that expires while a person types keeps the input and submits nothing', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  const name = uniqueName();
  await page.getByLabel('Organisation name').fill(name);

  // The session ends: no cached token, and the provider answers a silent renewal as the directory does without a session.
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage)) if (/accesstoken|refreshtoken/i.test(key)) sessionStorage.removeItem(key);
  });
  await page.route(`${authority}/authorize**`, (route) => {
    const request = new URL(route.request().url());
    if (request.searchParams.get('prompt') !== 'none') return route.continue();
    const back = new URL(request.searchParams.get('redirect_uri')!);
    back.hash = `error=login_required&state=${request.searchParams.get('state')}`;
    return route.fulfill({ status: 302, headers: { location: back.href } });
  });
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(`${urls.admin}/api/`) && request.method() !== 'GET') writes.push(request.url());
  });

  await page.getByRole('button', { name: 'Create organisation' }).click();

  await expect(page.getByRole('heading', { name: 'Sign in again to continue' })).toBeVisible();
  await expect(page.getByLabel('Your unsaved input')).toHaveValue(name);
  await expect(page.getByRole('button', { name: 'Sign in again' })).toBeVisible();
  expect(writes).toEqual([]);
  await expectAccessible();
});

test('Signing out reloads the other tabs and asks for sign-in again', async ({ page, secondPage, signIn }) => {
  const persona = await signIn();
  const { id } = await createOrganisation(page);
  await signIn({ on: secondPage, as: persona, path: `/organisations/${id}` });
  await expect(secondPage.getByRole('heading', { name: 'Overview' })).toBeVisible();

  await page.getByRole('button', { name: /Account/ }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await page.waitForURL((url) => url.href.startsWith(authority));
  await secondPage.waitForURL((url) => url.href.startsWith(authority));
});
