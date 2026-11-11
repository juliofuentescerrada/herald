import type { Page } from '@playwright/test';
import { createOrganisation, expect, test } from '../fixtures.ts';

/** Creates, completes and publishes a tournament, opens its registration and goes to its entries. */
const openForEntries = async (page: Page, title: string, terms: { team: boolean; capacity: number; admission: 'Automatic' | 'Manual' }) => {
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Create tournament' }).click();
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Game / variant', { exact: true }).fill('Card game · Constructed');
  await page.getByLabel('Entry kind', { exact: true }).selectOption(terms.team ? 'Team' : 'Individual');
  await page.getByLabel(terms.team ? 'Capacity in teams' : 'Capacity in individual entries', { exact: true }).fill(String(terms.capacity));
  if (terms.team) {
    await page.getByLabel('Minimum roster size', { exact: true }).fill('3');
    await page.getByLabel('Maximum roster size', { exact: true }).fill('5');
    await page.getByLabel('Active players per side', { exact: true }).fill('3');
  }
  await page.getByLabel('Registration opening', { exact: true }).fill('2026-11-10T09:00');
  await page.getByLabel('Registration closure', { exact: true }).fill('2026-11-13T18:00');
  await page.getByLabel('Planned start', { exact: true }).fill('2026-11-21T10:00');
  await page.getByLabel('Reference time zone', { exact: true }).selectOption('Europe/Madrid');
  await page.getByLabel('Location mode', { exact: true }).selectOption('Online');
  await page.getByLabel('Admission', { exact: true }).selectOption(terms.admission);
  await page.getByLabel('Check-in', { exact: true }).selectOption('Optional');
  await page.getByLabel('Visibility', { exact: true }).selectOption('Public');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.getByRole('link', { name: 'Review and publish' }).click();
  await page.getByRole('button', { name: 'Publish tournament' }).click();
  const registration = page.getByRole('region', { name: 'Registration' });
  await registration.getByRole('button', { name: 'Open registration' }).click();
  await expect(registration.getByRole('button', { name: 'Close registration' })).toBeVisible();

  await page.getByRole('link', { name: 'View entries' }).click();
  await expect(page.getByRole('heading', { name: `Entries · ${title}` })).toBeVisible();
  // Registration learns the terms through a local queue, milliseconds after the write: reload until they have arrived.
  const add = page.getByRole('button', { name: terms.team ? 'Add team' : 'Add player' });
  await expect(async () => {
    await page.reload();
    await expect(add).toBeEnabled({ timeout: 1_000 });
  }).toPass();
};

/** Adds an entry for a new guest through the add panel. */
const addNew = async (page: Page, kind: 'player' | 'team', name: string) => {
  await page.getByRole('button', { name: kind === 'team' ? 'Add team' : 'Add player' }).click();
  await page.getByRole('button', { name: 'Create new' }).click();
  await page.getByLabel('Name (alias)').fill(name);
  await page.getByRole('button', { name: `Create and enter ${kind}` }).click();
};

test('An owner enters players until the field is full, sees the next one wait, and a cancellation admits it', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Saturday Open', { team: false, capacity: 2, admission: 'Automatic' });
  await expect(page.getByRole('heading', { name: '0 of 2 individual entries' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible();
  await expectAccessible();

  await addNew(page, 'player', 'Robin Vale');
  await expect(page.getByText('Robin Vale added · Admitted.')).toBeVisible();
  await addNew(page, 'player', 'Sam Reed');
  await addNew(page, 'player', 'Ellis Stone');
  await expect(page.getByText('Ellis Stone added · Waiting: Capacity full.')).toBeVisible();

  await expect(page.getByRole('heading', { name: '2 of 2 individual entries' })).toBeVisible();
  const admitted = page.getByRole('list', { name: 'Admitted · 2' });
  await expect(admitted.getByRole('heading', { level: 3 })).toHaveText(['Robin Vale', 'Sam Reed']);
  const waiting = page.getByRole('list', { name: 'Waiting · 1' });
  await expect(waiting.getByRole('heading', { name: '1. Ellis Stone' })).toBeVisible();
  await expect(waiting.getByText(/^Capacity full · Waiting since .* · Europe\/Madrid$/)).toBeVisible();
  await expect(waiting.getByRole('button', { name: 'Admit: Ellis Stone' })).toBeDisabled();
  await expect(waiting.getByText('No free slot. Cancel an admitted entry or increase capacity.')).toBeVisible();
  await expectAccessible();

  await admitted.getByRole('button', { name: 'Cancel entry: Robin Vale' }).click();
  await expect(page.getByRole('heading', { name: 'Cancel Robin Vale’s entry?' })).toBeFocused();
  await expect(page.getByText('Ellis Stone, first in the capacity queue, will be admitted automatically.')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();

  await expect(page.getByRole('list', { name: 'Admitted · 2' }).getByRole('heading', { level: 3 })).toHaveText(['Sam Reed', 'Ellis Stone']);
  await expect(page.getByRole('heading', { name: 'Waiting · 0' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Cancelled · 1' }).getByRole('heading', { name: 'Robin Vale' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await page.getByRole('link', { name: 'Back to tournaments' }).first().click();
  const row = page.getByRole('listitem').filter({ hasText: 'Saturday Open' });
  await expect(row.getByText('2 of 2 individual entries admitted')).toBeVisible();
  await expect(row.getByRole('link', { name: 'Entries: Saturday Open' })).toBeVisible();
});

test('An owner enters teams under manual admission, enters an existing team when warned of a duplicate, and admits it', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Saturday Team League', { team: true, capacity: 4, admission: 'Manual' });

  // An existing team guest with no active entry: entered once, then cancelled.
  await addNew(page, 'team', 'Cedar Owls');
  await expect(page.getByText('Cedar Owls added · Waiting: Admission pending.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel entry: Cedar Owls' }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByRole('list', { name: 'Cancelled · 1' })).toBeVisible();

  await addNew(page, 'team', 'cedar  owls');
  await expect(page.getByText('Possible duplicate')).toBeVisible();
  const matches = page.getByRole('list', { name: 'Existing team guests' });
  await expect(matches.getByRole('heading', { name: 'Cedar Owls' })).toBeVisible();
  await expect(matches.getByText(/^Existing team · created \d+ \w+ \d{4}$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create a new team anyway' })).toBeVisible();
  await expectAccessible();

  await matches.getByRole('button', { name: 'Enter this team' }).click();
  const waiting = page.getByRole('list', { name: 'Waiting · 1' });
  await expect(waiting.getByRole('heading', { name: '1. Cedar Owls' })).toBeVisible();
  await expect(waiting.getByText(/^Admission pending · Waiting since/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '0 of 4 teams' })).toBeVisible();

  await waiting.getByRole('button', { name: 'Admit: Cedar Owls' }).click();
  await expect(page.getByRole('heading', { name: '1 of 4 teams' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Admitted · 1' }).getByRole('heading', { name: 'Cedar Owls' })).toBeVisible();
  await expect(page.getByText('Cedar Owls admitted.')).toBeVisible();
});
