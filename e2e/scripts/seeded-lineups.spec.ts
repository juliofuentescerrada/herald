import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

// h1-match-lineups 6.3: on the seeded Saltmarsh Team League (running, five a side, Granite Herons and Saltmarsh
// Wolves with seven players each), the owner opens the match, is stopped with four starters, completes both
// lineups and starts the match, which locks them.
test('The seeded owner records both lineups of a five-a-side match and starts it', async ({ page, signIn }, info) => {
  const herons = ['Ada Fenwick', 'Bram Holloway', 'Cleo Marsh', 'Dario Venn', 'Edda Thorne'];
  const wolves = ['Hugo Pell', 'Ines Carver', 'Joss Mallory', 'Kira Dunmore'];
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Saltmarsh Team League' }).click();
  await page.getByRole('link', { name: 'View schedule' }).click();
  await page.getByRole('link', { name: 'Granite Herons vs Saltmarsh Wolves' }).click();
  await expect(page.getByRole('heading', { name: 'Round 1 · Granite Herons vs Saltmarsh Wolves' })).toBeVisible();
  await expect(page.getByText('Granite Herons has no lineup.')).toBeVisible();
  await screen(page, info, 'match-scheduled');

  const first = page.getByRole('region', { name: 'Granite Herons · lineup' });
  const second = page.getByRole('region', { name: 'Saltmarsh Wolves · lineup' });
  for (const player of herons) await first.getByRole('checkbox', { name: player }).check();
  await first.getByRole('button', { name: 'Save lineup' }).click();
  await expect(page.getByText('Granite Herons’ lineup saved.')).toBeVisible();
  for (const player of wolves) await second.getByRole('checkbox', { name: player }).check();
  await expect(second.getByText('4 of 5 selected')).toBeVisible();
  await second.scrollIntoViewIfNeeded();
  await screen(page, info, 'one-side-incomplete');

  await expect(page.getByRole('button', { name: 'Start match' })).toBeDisabled();
  await page.getByRole('button', { name: 'Start match' }).scrollIntoViewIfNeeded();
  await screen(page, info, 'start-blocked');

  await second.getByRole('checkbox', { name: 'Lior Ashby' }).check();
  await second.getByRole('button', { name: 'Save lineup' }).click();
  await expect(page.getByText('Saltmarsh Wolves’ lineup saved.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start match' })).toBeEnabled();
  await screen(page, info, 'both-lineups-valid');

  await page.getByRole('button', { name: 'Start match' }).click();
  await expect(page.getByRole('dialog', { name: 'Start this match?' })).toBeVisible();
  await screen(page, info, 'start-confirmation');
  await page.getByRole('dialog').getByRole('button', { name: 'Start match' }).click();
  await expect(first.getByText('Locked', { exact: true })).toBeVisible();
  await expect(second.getByText('Locked', { exact: true })).toBeVisible();
  await screen(page, info, 'in-play-locked');
});
