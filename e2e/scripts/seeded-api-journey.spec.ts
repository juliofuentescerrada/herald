import { createOrganisation, expect, test } from '../fixtures.ts';
import { pilotApplication, scriptPersona } from '../environment.ts';
import { runLeague } from '../league.ts';
import { capture, screen } from './screens.ts';

// h1-api-journey 4.3: the seeded owner grants the pilot application every group in a new organisation of their own; the
// application then runs journey 30's league through the API, each request and response captured as text, and the owner reads the
// same final standings in the admin application. The seeded organisations are left as they are.
test('An independent client runs a league through the API and the owner reads the same final standings', async ({ page, request, signIn }, info) => {
  await signIn({ as: scriptPersona, path: '/organisations/new' });
  const organisation = await createOrganisation(page);
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await page.getByRole('button', { name: 'Grant access' }).click();
  const dialog = page.getByRole('dialog', { name: 'Grant access' });
  await dialog.getByLabel('Name', { exact: true }).fill('League client');
  await dialog.getByLabel('Application identifier', { exact: true }).fill(pilotApplication.oid);
  for (const group of ['Read', 'Tournament setup', 'Entries', 'Schedule', 'Results and corrections', 'Finalisation']) {
    await dialog.getByRole('checkbox', { name: new RegExp(`^${group} ·`) }).check();
  }
  await screen(page, info, 'grant-every-group');
  await dialog.getByRole('button', { name: 'Grant access' }).click();
  await expect(page.getByText('League client can act within its grant.')).toBeVisible();

  const { tournament, rows } = await runLeague(request, organisation.id, (step, sent, received) =>
    capture(info, step, `${sent}\n\n→ ${received}\n`));

  await page.goto(`/organisations/${organisation.id}/tournaments/${tournament}/standings`);
  await expect(page.getByText('Final · 6 of 6 matches resolved')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Standings' }).getByRole('row').nth(1)).toContainText(rows[0]![0]);
  await screen(page, info, 'admin-standings');
});
