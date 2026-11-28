import { expect, test } from '@playwright/test';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// m4-deploy 5.3: on the deployed slot, the owner persona finds the organisations the slot's job seeded, the other
// owner's organisation is not among them (D-21), and a seeded tournament's public page is served by the public slot.
test(`${scriptPersona.name} finds the seeded organisations on the deployed slot and opens a public page`, async ({ page, context, baseURL }, info) => {
  await page.goto('/');
  // The maintainer signs in here as the persona; the screenshots start once the browser is back on the slot.
  const lantern = page.getByRole('button', { name: 'Switch to Lantern Hall Players' });
  await expect(lantern).toBeVisible({ timeout: 280_000 });
  expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
  await expect(page.getByRole('button', { name: 'Switch to Riverside Board Society' })).toHaveCount(0);
  await screen(page, info, 'signed-in-workspace');

  await lantern.click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Edit configuration: Lantern Arch' })).toBeVisible();
  await screen(page, info, 'seeded-tournaments');

  await page.getByRole('link', { name: 'Edit configuration: Lantern Arch' }).click();
  const href = await page.getByRole('region', { name: 'Visibility' }).getByRole('link', { name: 'View public page' }).getAttribute('href');
  const visitor = await context.browser()!.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const publicPage = await visitor.newPage();
  await publicPage.goto(href!);
  await expect(publicPage.getByRole('heading', { name: 'Lantern Arch', level: 1 })).toBeVisible({ timeout: 60_000 }); // a cold start (D-7)
  await screen(publicPage, info, 'public-page-on-the-slot');
  await visitor.close();
});
