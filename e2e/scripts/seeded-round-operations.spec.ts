import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-round-operations 5.3: on the seeded Lantern Trophy (Kira Dunmore beat Nils Brandt, Lior Ashby withdrawn, so round 1 is
// completed) the owner reads the operations summary, withdraws Mara Quill, sees her matches resolved and the standings flagged;
// on the seeded Saltmarsh Team Cup, Ada Fenwick's sanction blocks the start of Copper Owls' match.
test('The seeded owner reads the operations summary, withdraws a player, reads the flagged standings and sees a sanctioned starter block a start', async ({ page, signIn }, info) => {
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Trophy' }).click();
  const tabs = page.getByRole('navigation', { name: 'Tournament sections' });
  await tabs.getByRole('link', { name: 'Schedule' }).click();
  const operations = page.getByRole('region', { name: 'Operations' });
  const rounds = operations.getByRole('list', { name: 'Rounds' });
  await expect(rounds.getByRole('listitem').first()).toContainText('Completed');
  await expect(operations.getByText('4 of 6 resolved')).toBeVisible();
  await screen(page, info, 'operations-summary-round-completed');

  const entrants = page.getByRole('region', { name: 'Entrants' });
  await expect(entrants.getByText('Reason: Moved away')).toBeVisible();
  await entrants.getByRole('button', { name: 'Withdraw Mara Quill' }).click();
  const confirm = page.getByRole('dialog', { name: 'Withdraw Mara Quill?' });
  await expect(confirm.getByText('2 unplayed matches will be resolved as Mara Quill’s absence, each opponent winning.', { exact: false })).toBeVisible();
  await confirm.getByRole('textbox', { name: 'Reason (required)' }).fill('Travelling for work');
  await screen(page, info, 'withdrawal-confirmation');

  await confirm.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByText('Mara Quill withdrawn. 2 matches resolved.')).toBeVisible();
  // Lior Ashby left first: their match becomes a double absence; Mara Quill's other matches are her absences.
  await expect(page.getByRole('list', { name: 'Round 1' }).getByText('Both were absent · 0 each · no play recorded')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Round 2' }).getByText('Mara Quill was absent · Kira Dunmore wins · no play recorded')).toBeVisible();
  await expect(entrants.getByText('Reason: Travelling for work')).toBeVisible();
  await screen(page, info, 'withdrawn-entrant-and-absences');

  await tabs.getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('Provisional · 6 of 6 matches resolved')).toBeVisible();
  const table = page.getByRole('table', { name: 'Standings' });
  await expect(table.getByRole('row').filter({ hasText: 'Mara Quill' })).toContainText('Withdrawn');
  await expect(table.getByRole('row').filter({ hasText: 'Lior Ashby' })).toContainText('Withdrawn');
  await screen(page, info, 'flagged-standings');

  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Saltmarsh Team Cup' }).click();
  await tabs.getByRole('link', { name: 'Schedule' }).click();
  const attention = page.getByRole('list', { name: 'Needs attention' });
  await expect(attention.getByText('Copper Owls’ lineup includes Ada Fenwick, who is unavailable. Revise the lineup before starting.')).toBeVisible();
  await screen(page, info, 'needs-attention');

  await page.getByRole('region', { name: 'Entrants' }).getByRole('button', { name: 'Frozen roster: Copper Owls' }).click();
  const roster = page.getByRole('dialog', { name: 'Copper Owls · frozen roster' });
  await expect(roster.getByText('Reason: Abusive conduct')).toBeVisible();
  await screen(page, info, 'frozen-roster-sanctioned');
  await roster.getByRole('button', { name: 'Close' }).click();

  await attention.getByRole('link').first().click();
  await expect(page.getByText('Copper Owls’ lineup includes Ada Fenwick, who is unavailable. Revise the lineup from the other eligible players.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start match' })).toBeDisabled();
  await screen(page, info, 'sanctioned-starter-blocks-start');
});
