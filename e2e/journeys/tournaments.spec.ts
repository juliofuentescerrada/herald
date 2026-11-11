import type { Page } from '@playwright/test';
import { createOrganisation, expect, test } from '../fixtures.ts';

/** Creates a draft with only a title from the tournaments page and waits for its own address. */
const createDraft = async (page: Page, title: string) => {
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Create tournament' }).click();
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('Draft saved')).toBeVisible();
  await expect(page).toHaveURL(/\/tournaments\/[0-9a-f-]{36}$/);
};

test('An owner creates a draft with a title, completes it, reviews it and publishes it', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No tournaments yet' })).toBeVisible();
  await expectAccessible();

  await createDraft(page, 'Autumn Open');
  const missing = page.getByRole('region', { name: 'Missing for publication' });
  await expect(missing.getByRole('link', { name: 'Capacity' })).toBeVisible();
  await expect(missing.getByRole('link', { name: 'Planned start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review and publish' })).toBeDisabled();
  await expect(page.getByText('Review is unavailable. Complete the values missing for publication first.')).toBeVisible();
  await expectAccessible();

  await page.getByLabel('Game / variant', { exact: true }).fill('Card game · Constructed');
  await page.getByLabel('Entry kind', { exact: true }).selectOption('Team');
  await page.getByLabel('Capacity in teams', { exact: true }).fill('16');
  await page.getByLabel('Minimum roster size', { exact: true }).fill('3');
  await page.getByLabel('Maximum roster size', { exact: true }).fill('5');
  await page.getByLabel('Active players per side', { exact: true }).fill('3');
  await page.getByLabel('Planned start', { exact: true }).fill('2026-11-14T10:00');
  await expect(page.getByText('14 November 2026, 10:00')).toBeVisible();
  await page.getByLabel('Reference time zone', { exact: true }).selectOption('Europe/Madrid');
  await page.getByLabel('Location mode', { exact: true }).selectOption('Online');
  await page.getByLabel('Admission', { exact: true }).selectOption('Automatic');
  await page.getByLabel('Check-in', { exact: true }).selectOption('Optional');
  await page.getByLabel('Visibility', { exact: true }).selectOption('Unlisted');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('It has everything publication needs.')).toBeVisible();

  await page.getByRole('link', { name: 'Review and publish' }).click();
  await expect(page.getByRole('heading', { name: 'Review before publishing' })).toBeVisible();
  await expect(page.getByText('16 teams')).toBeVisible();
  await expect(page.getByText('Unlisted — anyone with the link can read it; it is not listed.')).toBeVisible();
  await expect(page.getByText('A published tournament cannot be unpublished.')).toBeVisible();
  await expectAccessible();

  await page.getByRole('button', { name: 'Publish tournament' }).click();
  await expect(page.getByRole('heading', { name: 'Autumn Open', level: 1 })).toBeVisible();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
  await expectAccessible();

  await page.getByRole('link', { name: 'Back to tournaments' }).first().click();
  const row = page.getByRole('listitem').filter({ hasText: 'Autumn Open' });
  await expect(row.getByText('16 teams')).toBeVisible();
  await expect(row.getByText('Published', { exact: true })).toBeVisible();
  await expect(row.getByText('Registration not open')).toBeVisible();
  await expect(row.getByRole('link', { name: 'Edit configuration: Autumn Open' })).toBeVisible();
});

test('An owner saving a tournament that changed in another tab keeps their input, and the other change is intact', async ({ page, secondPage, signIn }) => {
  const persona = await signIn();
  await createOrganisation(page);
  await createDraft(page, 'Winter Cup');

  await signIn({ on: secondPage, as: persona, path: new URL(page.url()).pathname });
  await expect(secondPage.getByLabel('Title', { exact: true })).toHaveValue('Winter Cup');
  await secondPage.getByLabel('Capacity in entries', { exact: true }).fill('8');
  await secondPage.getByRole('button', { name: 'Save draft' }).click();
  await expect(secondPage.getByText('Draft saved')).toBeVisible();

  await page.getByLabel('Game / variant', { exact: true }).fill('Card game · Limited');
  await page.getByRole('button', { name: 'Save draft' }).click();

  await expect(page.getByText('This tournament changed elsewhere')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload latest' })).toBeVisible();
  await expect(page.getByLabel('Game / variant', { exact: true })).toHaveValue('Card game · Limited');

  await secondPage.reload();
  await expect(secondPage.getByLabel('Capacity in entries', { exact: true })).toHaveValue('8');
  await expect(secondPage.getByLabel('Game / variant', { exact: true })).toHaveValue('');
});

test('An owner opens the registration of a published tournament, closes it and reopens it', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await createDraft(page, 'Spring Open');
  await page.getByLabel('Game / variant', { exact: true }).fill('Card game · Constructed');
  await page.getByLabel('Entry kind', { exact: true }).selectOption('Individual');
  await page.getByLabel('Capacity in individual entries', { exact: true }).fill('8');
  await page.getByLabel('Planned start', { exact: true }).fill('2026-11-21T10:00');
  await page.getByLabel('Reference time zone', { exact: true }).selectOption('Europe/Madrid');
  await page.getByLabel('Location mode', { exact: true }).selectOption('Online');
  await page.getByLabel('Admission', { exact: true }).selectOption('Manual');
  await page.getByLabel('Check-in', { exact: true }).selectOption('Mandatory');
  await page.getByLabel('Visibility', { exact: true }).selectOption('Public');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.getByRole('link', { name: 'Review and publish' }).click();
  await page.getByRole('button', { name: 'Publish tournament' }).click();

  const registration = page.getByRole('region', { name: 'Registration' });
  await expect(registration.getByRole('button', { name: 'Open registration' })).toBeDisabled();
  await expect(registration.getByText('Set both registration dates before opening registration.')).toBeVisible();
  await registration.getByRole('link', { name: 'Set registration opening' }).click();
  await expect(page.getByLabel('Registration opening', { exact: true })).toBeFocused();
  await page.getByLabel('Registration opening', { exact: true }).fill('2026-11-10T09:00');
  await page.getByLabel('Registration closure', { exact: true }).fill('2026-11-13T18:00');
  await expect(registration.getByText('Save your changes first.')).toBeVisible();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(registration.getByText('13 November 2026, 18:00')).toBeVisible();

  await registration.getByRole('button', { name: 'Open registration' }).click();
  await expect(registration.getByRole('button', { name: 'Close registration' })).toBeVisible();
  await expect(registration.getByText(/^Opened .* · Europe\/Madrid$/)).toBeVisible();
  await expect(page.getByText('Registration open', { exact: true }).first()).toBeVisible();
  await expectAccessible();

  await page.getByRole('link', { name: 'Back to tournaments' }).first().click();
  const row = page.getByRole('listitem').filter({ hasText: 'Spring Open' });
  await expect(row.getByText('Registration open')).toBeVisible();
  await expect(row.getByText('Published', { exact: true })).toBeVisible();

  await row.getByRole('link', { name: 'Edit configuration: Spring Open' }).click();
  await registration.getByRole('button', { name: 'Close registration' }).click();
  await expect(registration.getByRole('button', { name: 'Reopen registration' })).toBeVisible();
  await expect(registration.getByText(/^Closed .* · Europe\/Madrid$/)).toBeVisible();

  await registration.getByRole('button', { name: 'Reopen registration' }).click();
  await expect(registration.getByRole('button', { name: 'Close registration' })).toBeVisible();
});
