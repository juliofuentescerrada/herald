import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

/** The same step at 1440 and 390 px, the widths the design compares with the prototypes (task 5.3). */
const both = async (page: Page, info: TestInfo, name: string) => {
  await screen(page, info, name);
  await page.setViewportSize({ width: 390, height: 844 });
  await screen(page, info, `${name}-390`);
  await page.setViewportSize({ width: 1440, height: 900 });
};

/** The seeded tournament's configuration page, and the address of its public page from "View public page" when it has one. */
const configuration = async (page: Page, title: string) => {
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: `Edit configuration: ${title}` }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(title);
  const visibility = page.getByRole('region', { name: 'Visibility' });
  await expect(visibility).toBeVisible();
  return visibility;
};

// It makes Lantern Gate private, so it runs once per seeded database: seed again before a second run.
// h1-public-read 4.3 on the seeded Lantern Hall Players: Autumn League before start, Lantern Gate running with an explanation,
// Lantern Arch final, Lantern Gate made private, and Lantern Vault's preview before it would become public.
test('A visitor reads the seeded public pages before start, running with an explanation and final, and the owner changes visibility', async ({ page, browser, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  const visitor = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
  const visit = async (title: string) => {
    const visibility = await configuration(page, title);
    await visitor.goto((await visibility.getByRole('link', { name: 'View public page' }).getAttribute('href'))!);
    await expect(visitor.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    return visibility;
  };

  // Before start: details, "Registration open" and "Preparing", no rounds or standings.
  await visit('Autumn League');
  await expect(visitor.getByRole('group', { name: 'Tournament lifecycle' })).toContainText('Registration open');
  await expect(visitor.getByRole('heading', { name: 'Rounds' })).toHaveCount(0);
  await both(visitor, info, 'public-before-start');

  // Running: rounds with causes, provisional standings with the results revision and time.
  const gate = await visit('Lantern Gate');
  const gateLink = visitor.url();
  await expect(visitor.getByText(/^Provisional · results revision \d+ · updated .* Europe\/Madrid$/)).toBeVisible();
  await both(visitor, info, 'public-running');

  // An entrant's explanation: its resolved matches with points and those still to play.
  const table = visitor.getByRole('table', { name: 'Standings' });
  await table.getByRole('row').nth(1).getByRole('button').click();
  await expect(table.getByText(/to play$/).first()).toBeVisible();
  await both(visitor, info, 'public-explained');

  // Unlisted and final, at its final revision.
  await visit('Lantern Arch');
  await expect(visitor.getByText(/^Final · final revision 1 · updated /)).toBeVisible();
  await both(visitor, info, 'public-final');

  // The owner's Visibility panel, then making Lantern Gate private after a confirmation.
  await configuration(page, 'Lantern Gate');
  await both(page, info, 'visibility-panel');
  await gate.getByRole('button', { name: 'Change visibility' }).click();
  const confirm = page.getByRole('dialog', { name: 'Make Lantern Gate private?' });
  await expect(confirm).toBeVisible();
  await screen(page, info, 'visibility-to-private');
  await confirm.getByRole('button', { name: 'Make private' }).click();
  await expect(page.getByText('Lantern Gate is private.')).toBeVisible();

  // The visitor's next request is refused, as for an unknown link.
  await visitor.goto(gateLink);
  await expect(visitor.getByRole('heading', { name: 'This tournament is not available' })).toBeVisible();
  await both(visitor, info, 'public-not-available');

  // A private tournament's preview before it would become public: title, dates and entrant aliases.
  const vault = await configuration(page, 'Lantern Vault');
  await vault.getByRole('button', { name: 'Change visibility' }).click();
  const preview = page.getByRole('dialog', { name: 'Make Lantern Vault public?' });
  await expect(preview.getByText('What becomes public')).toBeVisible();
  await both(page, info, 'visibility-preview');
  await preview.getByRole('button', { name: 'Keep private' }).click();
  await visitor.context().close();
});
