import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-competition-start 6.3: on the seeded Harbour Cup (team tournament, registration closed, schedule published,
// Granite Herons one player short), the owner reads why the start is blocked, completes the roster, starts the
// competition and sees the roster frozen.
test('The seeded owner completes a short roster, starts the competition and sees the roster frozen', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Harbour Cup' }).click();
  const competition = page.getByRole('region', { name: 'Competition' });
  await expect(competition.getByText('Granite Herons has 2 players (minimum 3).')).toBeVisible();
  await competition.scrollIntoViewIfNeeded();
  await screen(page, info, 'readiness-blocked');

  await page.getByRole('link', { name: 'View entries' }).click();
  await page.getByRole('button', { name: 'Roster: Granite Herons' }).click();
  const roster = page.getByRole('dialog', { name: 'Roster · Granite Herons' });
  await roster.getByRole('button', { name: 'Add player' }).click();
  await roster.getByRole('button', { name: 'Create new' }).click();
  await roster.getByLabel('Name (alias)').fill('Quinn Harrow');
  await roster.getByRole('button', { name: 'Create and add player' }).click();
  await expect(roster.getByText('3 of 3–5 players', { exact: true })).toBeVisible();
  await screen(page, info, 'roster-completed');
  await roster.getByRole('button', { name: 'Back to entries' }).click();

  // Tournaments learns the roster through a local queue: reload until the panel is ready.
  await page.getByRole('link', { name: 'Back to configuration' }).click();
  await expect(competition).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(competition.getByText('Ready to start')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await competition.scrollIntoViewIfNeeded();
  await screen(page, info, 'ready');

  await competition.getByRole('button', { name: 'Start competition' }).click();
  await expect(page.getByRole('dialog', { name: 'Start the competition?' })).toBeVisible();
  await screen(page, info, 'start-confirmation');
  await page.getByRole('dialog').getByRole('button', { name: 'Start competition' }).click();
  await expect(competition.getByText('Running', { exact: true })).toBeVisible();
  await competition.scrollIntoViewIfNeeded();
  await screen(page, info, 'running');

  await page.getByRole('link', { name: 'View entries' }).click();
  await expect(page.getByRole('heading', { name: 'Entries · Harbour Cup' })).toBeVisible();
  await expect(async () => {
    await page.reload();
    await expect(page.getByText('Running · entries are read-only')).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole('button', { name: 'Roster: Granite Herons' }).click();
  await expect(page.getByRole('dialog', { name: 'Roster · Granite Herons' }).getByText('Frozen at start')).toBeVisible();
  await screen(page, info, 'frozen-roster');
});
