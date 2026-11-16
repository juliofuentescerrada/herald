import type { Page } from '@playwright/test';
import { createOrganisation, expect, test } from '../fixtures.ts';

/** Creates, completes and publishes a tournament, opens its registration and goes to its entries. */
const openForEntries = async (page: Page, title: string, terms: { team: boolean; capacity: number; admission: 'Automatic' | 'Manual'; checkIn?: 'Optional' | 'Mandatory'; rosters?: [minimum: number, maximum: number, active: number] }) => {
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Create tournament' }).click();
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('Game / variant', { exact: true }).fill('Card game · Constructed');
  await page.getByLabel('Entry kind', { exact: true }).selectOption(terms.team ? 'Team' : 'Individual');
  await page.getByLabel(terms.team ? 'Capacity in teams' : 'Capacity in individual entries', { exact: true }).fill(String(terms.capacity));
  if (terms.team) {
    const [minimum, maximum, active] = terms.rosters ?? [3, 5, 3];
    await page.getByLabel('Minimum roster size', { exact: true }).fill(String(minimum));
    await page.getByLabel('Maximum roster size', { exact: true }).fill(String(maximum));
    await page.getByLabel('Active players per side', { exact: true }).fill(String(active));
  }
  await page.getByLabel('Registration opening', { exact: true }).fill('2026-11-10T09:00');
  await page.getByLabel('Registration closure', { exact: true }).fill('2026-11-13T18:00');
  await page.getByLabel('Planned start', { exact: true }).fill('2026-11-21T10:00');
  await page.getByLabel('Reference time zone', { exact: true }).selectOption('Europe/Madrid');
  await page.getByLabel('Location mode', { exact: true }).selectOption('Online');
  await page.getByLabel('Admission', { exact: true }).selectOption(terms.admission);
  await page.getByLabel('Check-in', { exact: true }).selectOption(terms.checkIn ?? 'Optional');
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

test('An owner marks a pending player absent, publishes a five-player schedule with one rest each, withdraws it with a reason and publishes it again', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Friday League', { team: false, capacity: 6, admission: 'Automatic', checkIn: 'Mandatory' });
  const players = ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch', 'Rowan Lake', 'Ellis Stone'];
  for (const player of players) {
    await addNew(page, 'player', player);
  }
  const admitted = page.getByRole('list', { name: 'Admitted · 6' });
  for (const player of players.filter((name) => name !== 'Ellis Stone')) {
    await admitted.getByRole('button', { name: `Check in: ${player}` }).click();
    await expect(page.getByText(`${player} checked in.`)).toBeVisible();
  }

  // Closing registration starts the absence review: the pending player blocks the schedule.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await page.getByRole('region', { name: 'Registration' }).getByRole('button', { name: 'Close registration' }).click();
  await page.getByRole('link', { name: 'View entries' }).click();
  const markAbsent = page.getByRole('button', { name: 'Mark absent: Ellis Stone' });
  await expect(async () => {
    await page.reload();
    await expect(markAbsent).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(page.getByText('1 entry is pending check-in')).toBeVisible();
  await markAbsent.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Mark absent' }).click();
  await expect(page.getByText('Ellis Stone marked absent.')).toBeVisible();
  await expectAccessible();

  // Competition learns the eligible field through a local queue: reload until generating is offered.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Friday League' })).toBeVisible();
  const admissionOrder = page.getByRole('radio', { name: 'Admission order' });
  await expect(async () => {
    await page.reload();
    await expect(admissionOrder).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await admissionOrder.check();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await expect(page.getByRole('heading', { name: '5 players · 5 rounds · 10 matches' })).toBeVisible();
  await expect(page.getByText(/^Rest: .* · no points$/)).toHaveCount(5);
  await expectAccessible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Schedule published · revision 1.')).toBeVisible();
  await page.getByRole('button', { name: 'Withdraw' }).click();
  await page.getByLabel('Reason (required)').fill('Late absence reported');
  await page.getByRole('dialog').getByRole('button', { name: 'Withdraw' }).click();
  await expect(page.getByText('Revision 1 withdrawn.')).toBeVisible();
  await page.locator('details.history > summary').click();
  await expect(page.getByText(/Reason: Late absence reported/)).toBeVisible();

  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Schedule published · revision 2.')).toBeVisible();
  await expect(page.getByText('Published · revision 2', { exact: true })).toBeVisible();
  await expectAccessible();
});

test('An owner sees a team tournament’s start blocked by an incomplete roster, completes it, starts the competition and is stopped from adding to the frozen roster', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Harbour Cup', { team: true, capacity: 4, admission: 'Automatic' });
  await addNew(page, 'team', 'North Stars');
  await addNew(page, 'team', 'River Falcons');
  const admitted = page.getByRole('list', { name: 'Admitted · 2' });
  const build = async (team: string, players: string[]) => {
    await admitted.getByRole('button', { name: `Roster: ${team}` }).click();
    const roster = page.getByRole('dialog', { name: `Roster · ${team}` });
    for (const player of players) {
      await roster.getByRole('button', { name: 'Add player' }).click();
      await roster.getByRole('button', { name: 'Create new' }).click();
      await roster.getByLabel('Name (alias)').fill(player);
      await roster.getByRole('button', { name: 'Create and add player' }).click();
      await expect(roster.getByText(player, { exact: true })).toBeVisible();
    }
    await roster.getByRole('button', { name: 'Back to entries' }).click();
    await expect(roster).toBeHidden();
  };
  await build('North Stars', ['Robin Vale', 'Sam Reed', 'Jamie Brook']);
  await build('River Falcons', ['Taylor Finch', 'Rowan Lake']);

  // Close registration and publish the schedule; Competition learns the field through a local queue.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await page.getByRole('region', { name: 'Registration' }).getByRole('button', { name: 'Close registration' }).click();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Harbour Cup' })).toBeVisible();
  const admissionOrder = page.getByRole('radio', { name: 'Admission order' });
  await expect(async () => {
    await page.reload();
    await expect(admissionOrder).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await admissionOrder.check();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Schedule published · revision 1.')).toBeVisible();

  // Tournaments learns the schedule and the rosters through local queues: reload until the panel says why it is blocked.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  const competition = page.getByRole('region', { name: 'Competition' });
  await expect(competition).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(competition.getByText('River Falcons’ roster is below the minimum')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(competition.getByText('River Falcons has 2 players (minimum 3).')).toBeVisible();
  await expect(competition.getByRole('button', { name: 'Start competition' })).toBeDisabled();
  await expectAccessible();

  await page.getByRole('link', { name: 'View entries' }).click();
  await expect(page.getByRole('heading', { name: 'Entries · Harbour Cup' })).toBeVisible();
  await build('River Falcons', ['Ellis Stone']);
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await expect(competition).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(competition.getByText('Ready to start')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await competition.getByRole('button', { name: 'Start competition' }).click();
  const confirm = page.getByRole('dialog', { name: 'Start the competition?' });
  await expect(confirm.getByText('Start fixes the 2 entrants, schedule revision 1 and the team rosters. It cannot be undone. No match starts by itself.')).toBeVisible();
  await confirm.getByRole('button', { name: 'Start competition' }).click();
  await expect(competition.getByText('Running', { exact: true })).toBeVisible();
  // Beside the title too, in place of Preparing.
  await expect(page.getByText('Running', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Preparing', { exact: true })).toHaveCount(0);
  await expectAccessible();

  // Registration learns the start through a local queue: reload until the roster is frozen.
  await page.getByRole('link', { name: 'View entries' }).click();
  await expect(page.getByRole('heading', { name: 'Entries · Harbour Cup' })).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(page.getByText('Running · entries are read-only')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('list', { name: 'Admitted · 2' }).getByRole('button', { name: 'Roster: River Falcons' }).click();
  const frozen = page.getByRole('dialog', { name: 'Roster · River Falcons' });
  await expect(frozen.getByText('Frozen at start')).toBeVisible();
  await expect(frozen.getByRole('button', { name: 'Add player' })).toHaveCount(0);
  await expectAccessible();
});

test('An owner records a team match’s lineups from seven-player frozen rosters, is stopped from starting with four starters on one side, completes the lineup and starts the match, which locks both lineups', async ({ page, signIn, expectAccessible }) => {
  // Fourteen roster members are entered through the drawer, one by one.
  test.slow();
  await signIn();
  await createOrganisation(page);
  await openForEntries(page, 'Saltmarsh League', { team: true, capacity: 4, admission: 'Automatic', rosters: [5, 7, 5] });
  await addNew(page, 'team', 'North Stars');
  await addNew(page, 'team', 'River Falcons');
  const admitted = page.getByRole('list', { name: 'Admitted · 2' });
  const squads: Record<string, string[]> = {
    'North Stars': ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch', 'Rowan Lake', 'Ellis Stone', 'Morgan Hale'],
    'River Falcons': ['Alex Kim', 'Casey Moss', 'Drew Lane', 'Eli Hart', 'Frankie Cole', 'Gale Ross', 'Harper Quinn'],
  };
  for (const [team, players] of Object.entries(squads)) {
    await admitted.getByRole('button', { name: `Roster: ${team}` }).click();
    const roster = page.getByRole('dialog', { name: `Roster · ${team}` });
    for (const player of players) {
      await roster.getByRole('button', { name: 'Add player' }).click();
      await roster.getByRole('button', { name: 'Create new' }).click();
      await roster.getByLabel('Name (alias)').fill(player);
      await roster.getByRole('button', { name: 'Create and add player' }).click();
      await expect(roster.getByText(player, { exact: true })).toBeVisible();
    }
    await roster.getByRole('button', { name: 'Back to entries' }).click();
    await expect(roster).toBeHidden();
  }

  // Close, publish and start; each module learns the others' changes through local queues.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  const registration = page.getByRole('region', { name: 'Registration' });
  await registration.getByRole('button', { name: 'Close registration' }).click();
  await expect(registration.getByRole('button', { name: 'Reopen registration' })).toBeVisible();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Saltmarsh League' })).toBeVisible();
  const admissionOrder = page.getByRole('radio', { name: 'Admission order' });
  await expect(async () => {
    await page.reload();
    await expect(admissionOrder).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await admissionOrder.check();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Schedule published · revision 1.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  const competition = page.getByRole('region', { name: 'Competition' });
  await expect(competition).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(competition.getByText('Ready to start')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await competition.getByRole('button', { name: 'Start competition' }).click();
  await page.getByRole('dialog', { name: 'Start the competition?' }).getByRole('button', { name: 'Start competition' }).click();
  await expect(competition.getByText('Running', { exact: true })).toBeVisible();

  // The running schedule links its match; the frozen rosters reach Competition through a local queue.
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Saltmarsh League' })).toBeVisible();
  const matchLink = page.getByRole('link', { name: 'View match: North Stars vs River Falcons' });
  await expect(async () => {
    await page.reload();
    await expect(matchLink).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await matchLink.click();
  await expect(page.getByRole('heading', { name: 'Round 1 · North Stars vs River Falcons' })).toBeVisible();
  const stars = page.getByRole('region', { name: 'North Stars · lineup' });
  const falcons = page.getByRole('region', { name: 'River Falcons · lineup' });
  await expect(async () => {
    await page.reload();
    await expect(stars.getByRole('checkbox', { name: 'Robin Vale' })).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await expect(page.getByText('North Stars has no lineup.')).toBeVisible();
  await expectAccessible();

  for (const player of squads['North Stars'].slice(0, 5)) await stars.getByRole('checkbox', { name: player }).check();
  await stars.getByRole('button', { name: 'Save lineup' }).click();
  await expect(page.getByText('North Stars’ lineup saved.')).toBeVisible();
  for (const player of squads['River Falcons'].slice(0, 4)) await falcons.getByRole('checkbox', { name: player }).check();
  await expect(falcons.getByText('4 of 5 selected')).toBeVisible();
  await expect(falcons.getByRole('button', { name: 'Save lineup' })).toBeDisabled();
  await expect(falcons.getByText('Choose exactly 5 players.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start match' })).toBeDisabled();
  await expectAccessible();

  await falcons.getByRole('checkbox', { name: 'Frankie Cole' }).check();
  await falcons.getByRole('button', { name: 'Save lineup' }).click();
  await expect(page.getByText('River Falcons’ lineup saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Start match' }).click();
  const confirm = page.getByRole('dialog', { name: 'Start this match?' });
  await expect(confirm.getByText('Starting locks both lineups: North Stars and River Falcons with 5 players each.', { exact: false })).toBeVisible();
  await confirm.getByRole('button', { name: 'Start match' }).click();
  await expect(page.getByText('In play', { exact: true })).toBeVisible();
  await page.getByText('North Stars · locked lineup', { exact: true }).click();
  await page.getByText('River Falcons · locked lineup', { exact: true }).click();
  await expect(stars.getByText('Locked', { exact: true })).toBeVisible();
  await expect(falcons.getByText('Locked', { exact: true })).toBeVisible();
  await expect(falcons.getByText('Reserves: Gale Ross, Harper Quinn')).toBeVisible();
  await expectAccessible();
});

// A running four-player league in a new organisation, with the schedule page open on its matches (journeys 20 and 21).
async function runningLanternOpen(page: Page): Promise<void> {
  await createOrganisation(page);
  await openForEntries(page, 'Lantern Open', { team: false, capacity: 4, admission: 'Automatic' });
  for (const player of ['Robin Vale', 'Sam Reed', 'Jamie Brook', 'Taylor Finch']) {
    await addNew(page, 'player', player);
    await expect(page.getByText(player, { exact: true })).toBeVisible();
  }

  // Close, publish and start; each module learns the others' changes through local queues.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  const registration = page.getByRole('region', { name: 'Registration' });
  await registration.getByRole('button', { name: 'Close registration' }).click();
  await expect(registration.getByRole('button', { name: 'Reopen registration' })).toBeVisible();
  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Lantern Open' })).toBeVisible();
  const admissionOrder = page.getByRole('radio', { name: 'Admission order' });
  await expect(async () => {
    await page.reload();
    await expect(admissionOrder).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await admissionOrder.check();
  await page.getByRole('button', { name: 'Generate draft' }).click();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Schedule published · revision 1.')).toBeVisible();
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  const competition = page.getByRole('region', { name: 'Competition' });
  await expect(competition).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(competition.getByText('Ready to start')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await competition.getByRole('button', { name: 'Start competition' }).click();
  await page.getByRole('dialog', { name: 'Start the competition?' }).getByRole('button', { name: 'Start competition' }).click();
  await expect(competition.getByText('Running', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'View schedule', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Lantern Open' })).toBeVisible();
  const first = page.getByRole('link', { name: 'View match: Robin Vale vs Taylor Finch' });
  await expect(async () => {
    await page.reload();
    await expect(first).toBeVisible({ timeout: 1_000 });
  }).toPass();

}

test('An owner records a win in an individual match, which starts and resolves it in one step, records a draw in another, and sees both results on the schedule', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);
  const first = page.getByRole('link', { name: 'View match: Robin Vale vs Taylor Finch' });

  // A win on a scheduled match starts and resolves it at once; nothing is preselected.
  await first.click();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await page.getByRole('radio', { name: 'Played' }).check();
  await expect(page.getByText('This match has not started: recording a played result also starts it.')).toBeVisible();
  await page.getByRole('radio', { name: 'Robin Vale wins' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Robin Vale won · played')).toBeVisible();
  await expect(page.getByText('Resolved', { exact: true }).first()).toBeVisible();
  await expectAccessible();

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await page.getByRole('link', { name: 'View match: Sam Reed vs Jamie Brook' }).click();
  await page.getByRole('radio', { name: 'Played' }).check();
  await page.getByRole('radio', { name: 'Draw' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Draw · played')).toBeVisible();

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  const round = page.getByRole('list', { name: 'Round 1' });
  await expect(round.getByText('Robin Vale won')).toBeVisible();
  await expect(round.getByText('Draw', { exact: true })).toBeVisible();
  await expect(round.getByText('Resolved')).toHaveCount(2);
  await expectAccessible();
});

test('An owner records a concession before play, a double absence and a no contest with its reason, and sees each cause on the schedule with no score', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);

  // A concession before play: the opponent wins, no play is recorded and the match does not start.
  await page.getByRole('link', { name: 'View match: Robin Vale vs Taylor Finch' }).click();
  await page.getByRole('radio', { name: 'Concession' }).check();
  await page.getByRole('group', { name: 'Who conceded?' }).getByRole('radio', { name: 'Robin Vale' }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Robin Vale conceded before play · Taylor Finch wins · no play recorded')).toBeVisible();
  await expect(page.getByText(/appearance/i)).toHaveCount(0);
  await expectAccessible();

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await page.getByRole('link', { name: 'View match: Sam Reed vs Jamie Brook' }).click();
  await page.getByRole('radio', { name: 'Absence' }).check();
  await page.getByRole('radio', { name: 'Both were absent' }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('Both were absent · 0 each · no play recorded')).toBeVisible();

  // A no contest needs its reason, kept privately.
  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await page.getByRole('list', { name: 'Round 2' }).getByRole('link').first().click();
  await page.getByRole('radio', { name: 'No contest' }).check();
  await page.getByRole('group', { name: 'Did play take place?' }).getByRole('radio', { name: 'No' }).check();
  await expect(page.getByText('A no contest needs a reason.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record result' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Reason (required)' }).fill('Venue closed');
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText('No contest: Venue closed · 0 each · no play recorded')).toBeVisible();

  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
  await expect(page.getByRole('list', { name: 'Round 1' }).getByText('Robin Vale conceded before play · Taylor Finch wins · no play recorded')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 1' }).getByText('Both were absent · 0 each · no play recorded')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 2' }).getByText('No contest: Venue closed · 0 each · no play recorded')).toBeVisible();
  await expect(page.getByText('· played')).toHaveCount(0);
  await expect(page.getByText(/\d+\s*[-–]\s*\d+/)).toHaveCount(0);
  await expectAccessible();
});

// The match between two players, whichever of them the pairings list first.
const matchLink = (page: Page, a: string, b: string) => page.getByRole('link', { name: new RegExp(`^View match: (${a} vs ${b}|${b} vs ${a})$`) });

const recordResult = async (page: Page, a: string, b: string, choice: string) => {
  await matchLink(page, a, b).click();
  await page.getByRole('radio', { name: 'Played' }).check();
  await page.getByRole('radio', { name: choice }).check();
  await page.getByRole('button', { name: 'Record result' }).click();
  await expect(page.getByText(choice === 'Draw' ? 'Draw · played' : `${choice.replace(' wins', '')} won · played`)).toBeVisible();
  await page.getByRole('link', { name: 'Back to schedule' }).first().click();
};

test('An owner records the results of a four-player league and reads its standings, with two players sharing a position and one player’s points traced to its results', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);

  // Robin Vale wins all three; Sam Reed and Jamie Brook draw and each beats Taylor Finch.
  await recordResult(page, 'Robin Vale', 'Taylor Finch', 'Robin Vale wins');
  await recordResult(page, 'Sam Reed', 'Jamie Brook', 'Draw');
  await recordResult(page, 'Robin Vale', 'Jamie Brook', 'Robin Vale wins');
  await recordResult(page, 'Taylor Finch', 'Sam Reed', 'Sam Reed wins');
  await recordResult(page, 'Robin Vale', 'Sam Reed', 'Robin Vale wins');
  await recordResult(page, 'Jamie Brook', 'Taylor Finch', 'Jamie Brook wins');

  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByRole('heading', { name: 'Standings · Lantern Open' })).toBeVisible();
  // Standings follow the results through a local queue: the page reads again until all six have arrived.
  await expect(page.getByText('Provisional · 6 of 6 matches resolved')).toBeVisible();
  const table = page.getByRole('table', { name: 'Standings' });
  await expect(table.getByText('Position 2, shared')).toHaveCount(2);
  const rows = table.getByRole('row');
  await expect(rows.nth(1)).toContainText('Robin Vale');
  await expect(rows.nth(1)).toContainText('9');
  await expect(rows.nth(2)).toContainText('Jamie Brook');
  await expect(rows.nth(3)).toContainText('Sam Reed');
  await expect(rows.nth(4)).toContainText('Taylor Finch');
  await expectAccessible();

  await table.getByRole('button', { name: 'Sam Reed' }).click();
  await expect(table.getByRole('button', { name: 'Sam Reed' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/vs Jamie Brook · draw · played · 1 point$/)).toBeVisible();
  await expect(page.getByText(/vs Taylor Finch · won · played · 3 points$/)).toBeVisible();
  await expect(page.getByText(/vs Robin Vale · lost · played · 0 points$/)).toBeVisible();
  await expect(page.getByText('Total: 4 points')).toBeVisible();
  await expectAccessible();
});

test('An owner withdraws a player during the competition with a reason, sees the player’s unplayed matches resolved as absences and the player flagged in the standings, and sees round 1 completed', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);
  await recordResult(page, 'Robin Vale', 'Taylor Finch', 'Robin Vale wins');

  const operations = page.getByRole('region', { name: 'Operations' });
  await expect(operations.getByRole('list', { name: 'Rounds' }).getByRole('listitem').first()).toContainText('Running');

  // The confirmation states what it resolves and needs a reason, private to the organisation.
  await page.getByRole('region', { name: 'Entrants' }).getByRole('button', { name: 'Withdraw Sam Reed' }).click();
  const confirm = page.getByRole('dialog', { name: 'Withdraw Sam Reed?' });
  await expect(confirm.getByText('3 unplayed matches will be resolved as Sam Reed’s absence, each opponent winning.', { exact: false })).toBeVisible();
  await confirm.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(confirm.getByText('Error: Enter a reason.')).toBeVisible();
  await expectAccessible();
  await confirm.getByRole('textbox', { name: 'Reason (required)' }).fill('Moved away');
  await confirm.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByText('Sam Reed withdrawn. 3 matches resolved.')).toBeVisible();

  await expect(page.getByRole('list', { name: 'Round 1' }).getByText('Sam Reed was absent · Jamie Brook wins · no play recorded')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 2' }).getByText('Sam Reed was absent · Taylor Finch wins · no play recorded')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 3' }).getByText('Sam Reed was absent · Robin Vale wins · no play recorded')).toBeVisible();
  await expect(operations.getByRole('list', { name: 'Rounds' }).getByRole('listitem').first()).toContainText('Completed');
  await expect(page.getByRole('region', { name: 'Entrants' }).getByText('Reason: Moved away')).toBeVisible();
  await expectAccessible();

  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('Provisional · 4 of 6 matches resolved')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Standings' }).getByRole('row').filter({ hasText: 'Sam Reed' })).toContainText('Withdrawn');
  await expectAccessible();
});

test('An owner corrects a recorded win to a draw with a reason, reviews the impact on points and standings before confirming, and sees the corrected result with its earlier version', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);
  await recordResult(page, 'Robin Vale', 'Sam Reed', 'Robin Vale wins');
  // The preview is Standings' own: wait until they have applied the win.
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('Provisional · 1 of 6 matches resolved')).toBeVisible();
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Schedule' }).click();

  await matchLink(page, 'Robin Vale', 'Sam Reed').click();
  await page.getByRole('button', { name: 'Correct result' }).click();
  const form = page.getByRole('region', { name: 'Correct result' });
  await expect(form.getByRole('radio', { name: 'Robin Vale wins' })).toBeChecked();
  await form.getByRole('radio', { name: 'Draw' }).check();
  await expect(form.getByRole('button', { name: 'Review impact' })).toBeDisabled();
  await form.getByRole('textbox', { name: 'Reason for the correction (required)' }).fill('Score sheet misread');
  await form.getByRole('button', { name: 'Review impact' }).click();

  // Nothing is applied until the owner confirms the reviewed impact.
  const impact = page.getByRole('region', { name: 'Impact of this correction' });
  const points = impact.getByRole('table', { name: 'Points and positions' });
  await expect(points.getByRole('row').filter({ hasText: 'Robin Vale' })).toContainText('3 → 1');
  await expect(points.getByRole('row').filter({ hasText: 'Sam Reed' })).toContainText('0 → 1');
  await expectAccessible();
  await impact.getByRole('button', { name: 'Apply correction' }).click();

  await expect(page.getByText('Result corrected. Standings updated.')).toBeVisible();
  const result = page.getByRole('region', { name: 'Result', exact: true });
  await expect(result.getByText('Draw · played')).toBeVisible();
  await expect(result.getByText('Corrected', { exact: true })).toBeVisible();
  await result.getByText('Result history').click();
  const history = result.getByRole('list', { name: 'Result history' });
  await expect(history).toContainText('Robin Vale won · played');
  await expect(history).toContainText('Reason: Score sheet misread');
  await expectAccessible();
});

test('An owner reviews the standings of a fully resolved league, finalises it, sees them final, then reopens it with a reason, corrects a result and finalises again with the earlier final revision kept', async ({ page, signIn, expectAccessible }) => {
  await signIn();
  await runningLanternOpen(page);
  await recordResult(page, 'Robin Vale', 'Taylor Finch', 'Robin Vale wins');
  await recordResult(page, 'Sam Reed', 'Jamie Brook', 'Draw');
  await recordResult(page, 'Robin Vale', 'Jamie Brook', 'Robin Vale wins');
  await recordResult(page, 'Taylor Finch', 'Sam Reed', 'Sam Reed wins');
  await recordResult(page, 'Robin Vale', 'Sam Reed', 'Robin Vale wins');
  await recordResult(page, 'Jamie Brook', 'Taylor Finch', 'Jamie Brook wins');
  const sections = page.getByRole('navigation', { name: 'Tournament sections' });

  // The review barrier: Finalise is offered once the standings have applied the current results revision.
  await sections.getByRole('link', { name: 'Standings' }).click();
  const review = page.getByRole('region', { name: 'Review and finalise' });
  await expect(review.getByText('All 6 matches are resolved.', { exact: false })).toBeVisible();
  await expect(review.getByText(/^Results revision (\d+) · standings revision \1 · you are reviewing revision \1$/)).toBeVisible();
  await expectAccessible();
  await review.getByRole('button', { name: 'Finalise' }).click();

  await expect(page.getByText('Lantern Open finalised.')).toBeVisible();
  await expect(page.getByText('Final', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Final revision 1 · results revision \d+$/).first()).toBeVisible();
  await expectAccessible();

  // Reopening asks for a reason, then the competition runs again with final revision 1 listed.
  await page.getByRole('button', { name: 'Reopen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reopen Lantern Open?' });
  await dialog.getByRole('textbox', { name: 'Reason (required)' }).fill('Result appeal upheld');
  await expectAccessible();
  await dialog.getByRole('button', { name: 'Reopen' }).click();
  await expect(page.getByText('Lantern Open reopened.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Final revisions' })).toContainText('Reason: Result appeal upheld');

  await sections.getByRole('link', { name: 'Schedule' }).click();
  await matchLink(page, 'Robin Vale', 'Sam Reed').click();
  await page.getByRole('button', { name: 'Correct result' }).click();
  const form = page.getByRole('region', { name: 'Correct result' });
  await form.getByRole('radio', { name: 'Draw' }).check();
  await form.getByRole('textbox', { name: 'Reason for the correction (required)' }).fill('Appeal upheld');
  await form.getByRole('button', { name: 'Review impact' }).click();
  await page.getByRole('region', { name: 'Impact of this correction' }).getByRole('button', { name: 'Apply correction' }).click();
  await expect(page.getByText('Result corrected. Standings updated.')).toBeVisible();

  // A new review of the corrected standings finalises again as final revision 2.
  await sections.getByRole('link', { name: 'Standings' }).click();
  await review.getByRole('button', { name: 'Finalise' }).click();
  await expect(page.getByText('Lantern Open finalised.')).toBeVisible();
  await expect(page.getByText(/^Final revision 2 · results revision \d+$/).first()).toBeVisible();
  await page.getByText('Final revisions').click();
  const revisions = page.getByRole('list', { name: 'Final revisions' });
  await expect(revisions.getByRole('listitem')).toHaveCount(2);
  await expect(revisions).toContainText('Reason: Result appeal upheld');
  await expectAccessible();
});
