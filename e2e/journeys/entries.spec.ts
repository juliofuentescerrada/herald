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
  await page.getByRole('link', { name: 'View schedule' }).click();
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
  await page.getByRole('link', { name: 'View schedule' }).click();
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

test('An owner records a team match’s lineups from seven-player frozen rosters, is stopped from starting with four starters, completes the lineup and starts the match, which locks both lineups', async ({ page, signIn, expectAccessible }) => {
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
  await page.getByRole('link', { name: 'View schedule' }).click();
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
  await page.getByRole('link', { name: 'View schedule' }).click();
  await expect(page.getByRole('heading', { name: 'Schedule · Saltmarsh League' })).toBeVisible();
  const matchLink = page.getByRole('link', { name: 'North Stars vs River Falcons' });
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
  await expect(page.getByText('North Stars’s lineup saved.')).toBeVisible();
  for (const player of squads['River Falcons'].slice(0, 4)) await falcons.getByRole('checkbox', { name: player }).check();
  await expect(falcons.getByText('4 of 5 selected')).toBeVisible();
  await expect(falcons.getByRole('button', { name: 'Save lineup' })).toBeDisabled();
  await expect(falcons.getByText('Choose exactly 5 players.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start match' })).toBeDisabled();
  await expectAccessible();

  await falcons.getByRole('checkbox', { name: 'Frankie Cole' }).check();
  await falcons.getByRole('button', { name: 'Save lineup' }).click();
  await expect(page.getByText('River Falcons’s lineup saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Start match' }).click();
  const confirm = page.getByRole('dialog', { name: 'Start this match?' });
  await expect(confirm.getByText('Starting locks both lineups: North Stars and River Falcons with 5 players each.', { exact: false })).toBeVisible();
  await confirm.getByRole('button', { name: 'Start match' }).click();
  await expect(page.getByText('In play', { exact: true })).toBeVisible();
  await expect(stars.getByText('Locked', { exact: true })).toBeVisible();
  await expect(falcons.getByText('Locked', { exact: true })).toBeVisible();
  await expect(falcons.getByText('Reserves: Gale Ross, Harper Quinn')).toBeVisible();
  await expectAccessible();
});
