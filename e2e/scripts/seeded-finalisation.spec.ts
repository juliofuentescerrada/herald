import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

/** The same step at 1440 and 390 px, the widths the design compares with the prototypes (task 6.3). */
const both = async (page: Page, info: TestInfo, name: string) => {
  await screen(page, info, name);
  await page.setViewportSize({ width: 390, height: 844 });
  await screen(page, info, `${name}-390`);
  await page.setViewportSize({ width: 1440, height: 900 });
};

const openTournament = async (page: Page, title: string, section: string) => {
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: `Edit configuration: ${title}` }).click();
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: section }).click();
};

// h1-finalisation 5.3: on the seeded Lantern Bowl, every match resolved, the owner reviews and finalises the standings, reopens
// them with a reason and finalises again, the first final revision kept.
test('The seeded owner finalises a fully resolved league, reopens it with a reason and finalises it again', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await openTournament(page, 'Lantern Bowl', 'Standings');

  const review = page.getByRole('region', { name: 'Review and finalise' });
  await expect(review.getByText(/^Results revision (\d+) · standings revision \1 · you are reviewing revision \1$/)).toBeVisible();
  await both(page, info, 'review-panel');

  await review.getByRole('button', { name: 'Finalise' }).click();
  await expect(page.getByText('Lantern Bowl finalised.')).toBeVisible();
  await expect(page.getByText(/^Final revision 1 · results revision \d+$/).first()).toBeVisible();
  await both(page, info, 'final-standings');

  await page.getByRole('button', { name: 'Reopen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reopen Lantern Bowl?' });
  await dialog.getByRole('textbox', { name: 'Reason (required)' }).fill('Result appeal upheld');
  await both(page, info, 'reopen-confirmation');

  await dialog.getByRole('button', { name: 'Reopen' }).click();
  await expect(page.getByText('Lantern Bowl reopened.')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Final revisions' })).toContainText('Reason: Result appeal upheld');
  await both(page, info, 'reopened-with-history');

  await review.getByRole('button', { name: 'Finalise' }).click();
  await expect(page.getByText(/^Final revision 2 · results revision \d+$/).first()).toBeVisible();
  await page.getByText('Final revisions').click();
  await expect(page.getByRole('list', { name: 'Final revisions' }).getByRole('listitem')).toHaveCount(2);
  await both(page, info, 'final-again');
});

// The other Visual input states: unresolved matches on Lantern Open, the finalised Lantern Cup's match page, and Standings behind,
// a stale review, finalising in progress and no active entrant produced by answering those requests in the browser.
test('The seeded owner sees the unresolved, updating, stale, finalising, no-champion and finalised-match states', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await openTournament(page, 'Lantern Open', 'Standings');
  await expect(page.getByRole('region', { name: 'Review and finalise' }).getByText('matches are unresolved', { exact: false })).toBeVisible();
  await both(page, info, 'finalise-unresolved');

  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Bowl' }).click();
  // Standings one revision behind Competition's results.
  await page.route('**/standings', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, revision: body.revision - 1 } });
  });
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('Standings are updating')).toBeVisible();
  await both(page, info, 'finalise-updating');
  await page.unroute('**/standings');

  await page.reload();
  const review = page.getByRole('region', { name: 'Review and finalise' });
  await page.route('**/finalisation', () => undefined);
  await review.getByRole('button', { name: 'Finalise' }).click();
  await expect(page.getByText('Finalising. Please wait; do not submit again.')).toBeVisible();
  await both(page, info, 'finalising');
  await page.unroute('**/finalisation');

  await page.reload();
  await page.route('**/finalisation', async (route) => {
    // The schedule as Competition answers it, read with the page's own credentials, one results revision ahead.
    const schedule = await (await route.fetch({ url: route.request().url().replace('/finalisation', '/schedule'), method: 'GET', postData: undefined })).json();
    await route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 400, errors: { review: ['stale'] }, schedule: { ...schedule, resultsRevision: schedule.resultsRevision + 1 } }),
    });
  });
  await review.getByRole('button', { name: 'Finalise' }).click();
  await expect(page.getByText('Standings changed since your review')).toBeVisible();
  await both(page, info, 'finalise-stale');
  await page.unroute('**/finalisation');

  // The finalised Lantern Cup, its standings answered as if every entrant had departed.
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Cup' }).click();
  await page.route('**/standings', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const rows = body.rows.map((row: { entrant: object }) => ({ ...row, entrant: { ...row.entrant, status: 'withdrawn' } }));
    await route.fulfill({ response, json: { ...body, rows, noChampion: true } });
  });
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Standings' }).click();
  await expect(page.getByText('No active entrant')).toBeVisible();
  await both(page, info, 'final-no-champion');
  await page.unroute('**/standings');

  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Schedule' }).click();
  await page.getByRole('link', { name: /^View match: / }).first().click();
  await expect(page.getByText('The competition is finalised')).toBeVisible();
  await both(page, info, 'correct-finalised');
});
