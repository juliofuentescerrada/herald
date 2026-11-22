import { pilotApplication } from '../environment.ts';
import { createOrganisation, expect, test } from '../fixtures.ts';
import { runLeague } from '../league.ts';

// Journey 30 (h1-api-journey D-4, N-9): the owner creates the organisation, grants the client every group and reads the Standings
// page; the league itself goes through the API with the pilot application's token.
test('An independent client runs a four-player league through the API, repeats a result after losing the response and gets the original receipt, and reads the same final standings as the admin application', {
  annotation: { type: 'covers', description: 'api-description: An independent client' },
}, async ({ page, request, signIn, expectAccessible }) => {
  await signIn();
  const organisation = await createOrganisation(page);
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await page.getByRole('button', { name: 'Grant access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Grant access' });
  await dialog.getByLabel('Name', { exact: true }).fill('League client');
  await dialog.getByLabel('Application identifier', { exact: true }).fill(pilotApplication.oid);
  for (const group of ['Read', 'Tournament setup', 'Entries', 'Schedule', 'Results and corrections', 'Finalisation']) {
    await dialog.getByRole('checkbox', { name: new RegExp(`^${group} ·`) }).check();
  }
  await dialog.getByRole('button', { name: 'Grant access' }).click();
  await expect(page.getByText('League client can act within its grant.')).toBeVisible();

  const { tournament, rows } = await runLeague(request, organisation.id);
  expect(rows).toEqual([['Robin Vale', 9], ['Jamie Brook', 4], ['Sam Reed', 4], ['Taylor Finch', 0]]);

  // The admin application shows the same final standings.
  await page.goto(`/organisations/${organisation.id}/tournaments/${tournament}/standings`);
  await expect(page.getByText('Final · 6 of 6 matches resolved')).toBeVisible();
  const table = page.getByRole('table', { name: 'Standings' });
  for (const [index, [player, points]] of rows.entries()) {
    const row = table.getByRole('row').nth(index + 1);
    await expect(row.getByRole('button', { name: player })).toBeVisible();
    await expect(row.getByRole('cell').last()).toHaveText(String(points));
  }
  await expectAccessible();
});
