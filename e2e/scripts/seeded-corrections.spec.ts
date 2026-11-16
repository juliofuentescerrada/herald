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

// h1-safe-corrections 5.3: on the seeded Lantern Plate (Mara Quill's win over Nils Brandt already corrected to a draw, Odile Faure
// beat Piers Galloway) the owner corrects Odile Faure's win to a draw, reviews its impact and reads the corrected result's history.
test('The seeded owner corrects a win to a draw after reviewing its impact and reads the result history', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Plate' }).click();
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Schedule' }).click();

  await page.getByRole('link', { name: /^View match: (Odile Faure vs Piers Galloway|Piers Galloway vs Odile Faure)$/ }).click();
  const result = page.getByRole('region', { name: 'Result', exact: true });
  await expect(result.getByText('Odile Faure won · played')).toBeVisible();
  await both(page, info, 'resolved-match');

  await result.getByRole('button', { name: 'Correct result' }).click();
  const form = page.getByRole('region', { name: 'Correct result' });
  await form.getByRole('radio', { name: 'Draw' }).check();
  await form.getByRole('textbox', { name: 'Reason for the correction (required)' }).fill('Score sheet misread');
  await both(page, info, 'correction-form');

  await form.getByRole('button', { name: 'Review impact' }).click();
  const points = page.getByRole('region', { name: 'Impact of this correction' }).getByRole('table', { name: 'Points and positions' });
  await expect(points.getByRole('row').filter({ hasText: 'Odile Faure' })).toContainText('3 → 1');
  await expect(points.getByRole('row').filter({ hasText: 'Piers Galloway' })).toContainText('0 → 1');
  await both(page, info, 'correction-impact');

  await page.getByRole('button', { name: 'Apply correction' }).click();
  await expect(page.getByText('Result corrected. Standings updated.')).toBeVisible();
  await expect(result.getByText('Corrected', { exact: true })).toBeVisible();
  await result.getByText('Result history').click();
  await expect(result.getByRole('list', { name: 'Result history' })).toContainText('Odile Faure won · played');
  await both(page, info, 'corrected-with-history');
});

// The recovery states of the Visual input, on the seeded corrected Mara Quill vs Nils Brandt: Standings behind, the match changed
// elsewhere and a failed save are produced by answering those two requests in the browser; nothing is applied.
test('The seeded owner sees a stale preview, a conflict and a failed save keep the correction', async ({ page, signIn }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn({ as: scriptPersona });
  await page.getByRole('button', { name: 'Switch to Lantern Hall Players' }).click();
  await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
  await page.getByRole('link', { name: 'Edit configuration: Lantern Plate' }).click();
  await page.getByRole('navigation', { name: 'Tournament sections' }).getByRole('link', { name: 'Schedule' }).click();
  await page.getByRole('link', { name: /^View match: (Mara Quill vs Nils Brandt|Nils Brandt vs Mara Quill)$/ }).click();
  const result = page.getByRole('region', { name: 'Result', exact: true });
  await expect(result.getByText('Corrected', { exact: true })).toBeVisible();

  await result.getByRole('button', { name: 'Correct result' }).click();
  const form = page.getByRole('region', { name: 'Correct result' });
  await form.getByRole('radio', { name: 'Mara Quill wins' }).check();
  await form.getByRole('textbox', { name: 'Reason for the correction (required)' }).fill('Winner confirmed by the referee');
  await page.route('**/standings/preview?**', (route) => route.fulfill({
    json: { tournamentId: '00000000-0000-0000-0000-000000000000', revision: 3, updating: true, matchRevision: 1, entrants: [] },
  }));
  await form.getByRole('button', { name: 'Review impact' }).click();
  await expect(page.getByText('The standings are updating')).toBeVisible();
  await both(page, info, 'stale-preview');

  await page.unroute('**/standings/preview?**');
  await page.getByRole('button', { name: 'Review again' }).click();
  await expect(page.getByRole('button', { name: 'Apply correction' })).toBeVisible();
  const problem = (status: number, body: object) => ({ status, contentType: 'application/problem+json', body: JSON.stringify(body) });
  await page.route('**/result/correction', (route) => route.fulfill(problem(409, { type: 'match-revision-conflict', title: 'Conflict', status: 409 })));
  await page.getByRole('button', { name: 'Apply correction' }).click();
  await expect(page.getByText('This match changed elsewhere')).toBeVisible();
  await both(page, info, 'conflict');

  await page.getByRole('button', { name: 'Reload latest' }).click();
  await page.unroute('**/result/correction');
  await page.route('**/result/correction', (route) => route.fulfill(problem(500, { title: 'Server error', status: 500 })));
  await page.getByRole('button', { name: 'Apply correction' }).click();
  await expect(page.getByText('The correction could not be saved')).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'Reason for the correction (required)' })).toHaveValue('Winner confirmed by the referee');
  await both(page, info, 'failed-save');
});
