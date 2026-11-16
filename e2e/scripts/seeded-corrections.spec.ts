import { expect, test } from '../fixtures.ts';
import { scriptPersona } from '../environment.ts';
import { screen } from './screens.ts';

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
  await screen(page, info, 'resolved-match');

  await result.getByRole('button', { name: 'Correct result' }).click();
  const form = page.getByRole('region', { name: 'Correct result' });
  await form.getByRole('radio', { name: 'Draw' }).check();
  await form.getByRole('textbox', { name: 'Reason for the correction (required)' }).fill('Score sheet misread');
  await screen(page, info, 'correction-form');

  await form.getByRole('button', { name: 'Review impact' }).click();
  const points = page.getByRole('region', { name: 'Impact of this correction' }).getByRole('table', { name: 'Points and positions' });
  await expect(points.getByRole('row').filter({ hasText: 'Odile Faure' })).toContainText('3 → 1');
  await expect(points.getByRole('row').filter({ hasText: 'Piers Galloway' })).toContainText('0 → 1');
  await screen(page, info, 'correction-impact');
  await page.setViewportSize({ width: 390, height: 844 });
  await screen(page, info, 'correction-impact-390');
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.getByRole('button', { name: 'Apply correction' }).click();
  await expect(page.getByText('Result corrected. Standings updated.')).toBeVisible();
  await expect(result.getByText('Corrected', { exact: true })).toBeVisible();
  await result.getByText('Result history').click();
  await expect(result.getByRole('list', { name: 'Result history' })).toContainText('Odile Faure won · played');
  await screen(page, info, 'corrected-with-history');
  await page.setViewportSize({ width: 390, height: 844 });
  await screen(page, info, 'corrected-with-history-390');
});
