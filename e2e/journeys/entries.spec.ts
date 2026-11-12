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

/** Adds an entry for a new guest through the add drawer. */
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
  await expect(page.getByText('Automatic admission · 0 waiting for a slot')).toBeVisible();
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
  const dialog = page.getByRole('dialog', { name: 'Cancel Robin Vale’s entry?' });
  await expect(dialog.getByRole('button', { name: 'Keep entry' })).toBeFocused();
  await expect(dialog.getByText('Ellis Stone, first in the capacity queue, will be admitted automatically.')).toBeVisible();
  await expectAccessible();
  await dialog.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Robin Vale’s entry cancelled.')).toBeVisible();

  await expect(page.getByRole('list', { name: 'Admitted · 2' }).getByRole('heading', { level: 3 })).toHaveText(['Sam Reed', 'Ellis Stone']);
  await expect(page.getByRole('heading', { name: 'Waiting · 0' })).toBeVisible();
  // Cancelled entries are history: collapsed, with their count.
  const history = page.getByRole('list', { name: 'Cancelled entries' });
  await expect(history).toBeHidden();
  await page.getByText('Cancelled · 1').click();
  await expect(history.getByText('Robin Vale')).toBeVisible();

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
  await expect(page.getByText('Cancelled · 1')).toBeVisible();

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
  await expect(page.getByText('Manual admission · 1 pending your decision')).toBeVisible();

  await waiting.getByRole('button', { name: 'Admit: Cedar Owls' }).click();
  await expect(page.getByRole('heading', { name: '1 of 4 teams' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Admitted · 1' }).getByRole('heading', { name: 'Cedar Owls' })).toBeVisible();
  await expect(page.getByText('Cedar Owls admitted.')).toBeVisible();
});

test('An owner builds a team’s roster to its minimum, is stopped from adding a player on another team, and sees the roster complete', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Sunday Team Cup', { team: true, capacity: 4, admission: 'Automatic' });
  await addNew(page, 'team', 'North Stars');
  await addNew(page, 'team', 'River Falcons');
  const admitted = page.getByRole('list', { name: 'Admitted · 2' });
  await expect(admitted.getByText('0 of 3–5 players · incomplete')).toHaveCount(2);

  await admitted.getByRole('button', { name: 'Roster: North Stars' }).click();
  const roster = page.getByRole('dialog', { name: 'Roster · North Stars' });
  await expect(roster.getByText('No players yet.')).toBeVisible();
  for (const player of ['Robin Vale', 'Sam Reed', 'Jamie Brook']) {
    await roster.getByRole('button', { name: 'Add player' }).click();
    await roster.getByRole('button', { name: 'Create new' }).click();
    await roster.getByLabel('Name (alias)').fill(player);
    await roster.getByRole('button', { name: 'Create and add player' }).click();
    await expect(roster.getByText(player, { exact: true })).toBeVisible();
  }
  await expect(roster.getByRole('heading', { name: 'Members · 3' })).toBeVisible();
  await expect(roster.getByText('3 of 3–5 players', { exact: true })).toBeVisible();
  await expectAccessible();
  await roster.getByRole('button', { name: 'Back to entries' }).click();
  await expect(roster).toBeHidden();

  // Robin Vale is on North Stars: River Falcons' search shows them unavailable, with no way to add them.
  await admitted.getByRole('button', { name: 'Roster: River Falcons' }).click();
  const other = page.getByRole('dialog', { name: 'Roster · River Falcons' });
  await other.getByRole('button', { name: 'Add player' }).click();
  await other.getByRole('button', { name: 'Choose existing' }).click();
  await other.getByLabel('Search by name').fill('Robin');
  const found = other.getByRole('list', { name: 'Existing player guests' });
  await expect(found.getByText('On North Stars')).toBeVisible();
  await expect(found.getByRole('button', { name: 'Add player: Robin Vale' })).toHaveCount(0);
  await expectAccessible();
  await other.getByRole('button', { name: 'Back to entries' }).click();

  const north = admitted.getByRole('listitem').filter({ hasText: 'North Stars' });
  await expect(north.getByText('3 of 3–5 players', { exact: true })).toBeVisible();
  await expect(admitted.getByRole('listitem').filter({ hasText: 'River Falcons' }).getByText('0 of 3–5 players · incomplete')).toBeVisible();
});

test('An owner checks in two admitted players, undoes one check-in, and sees 1 of 2 checked in', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Thursday Open', { team: false, capacity: 2, admission: 'Automatic' });
  await addNew(page, 'player', 'Robin Vale');
  await addNew(page, 'player', 'Sam Reed');
  await expect(page.getByText('Check-in optional · 0 of 2 checked in')).toBeVisible();
  const admitted = page.getByRole('list', { name: 'Admitted · 2' });
  await expect(admitted.getByText('Check-in pending')).toHaveCount(2);

  for (const player of ['Robin Vale', 'Sam Reed']) {
    await admitted.getByRole('button', { name: `Check in: ${player}` }).click();
    await expect(page.getByText(`${player} checked in.`)).toBeVisible();
  }
  await expect(page.getByText('Check-in optional · 2 of 2 checked in')).toBeVisible();
  await expect(admitted.getByText('Checked in', { exact: true })).toHaveCount(2);
  await expectAccessible();

  await admitted.getByRole('button', { name: 'Undo check-in: Sam Reed' }).click();
  await expect(page.getByText('Sam Reed’s check-in undone.')).toBeVisible();
  await expect(page.getByText('Check-in optional · 1 of 2 checked in')).toBeVisible();
  const sam = admitted.getByRole('listitem').filter({ hasText: 'Sam Reed' });
  await expect(sam.getByText('Check-in pending')).toBeVisible();
  await expect(sam.getByRole('button', { name: 'Check in: Sam Reed' })).toBeVisible();
  await expect(admitted.getByRole('listitem').filter({ hasText: 'Robin Vale' }).getByText(/^Checked in .* · Europe\/Madrid$/)).toBeVisible();
});
