// Dated review utility, not the composed E2E suite. Start the unchanged catalogue/public apps first.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../../e2e/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const browser = await chromium.launch({
  ...(process.env.HERALD_CHROMIUM ? { executablePath: process.env.HERALD_CHROMIUM } : {}),
  headless: true,
});

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const report = {
    method: 'Anonymous local Chromium review; no host, identity provider or composed E2E',
    browser: browser.version(),
    pages: [],
    interactions: {},
  };
  for (const [name, url] of [
    ['public-home', 'http://127.0.0.1:4300/'],
    ['public-not-found', 'http://127.0.0.1:4300/missing'],
    ['catalogue', 'http://127.0.0.1:4400/'],
  ]) {
    for (const width of [320, 390, 699, 700, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      await page.locator('h1').waitFor();
      // Let hydration finish before inspecting Tabler's imperative SVG leaf.
      await page.waitForTimeout(300);
      const record = {
        name,
        width,
        ...await page.evaluate(() => {
          const main = document.querySelector('main');
          return {
            scrollWidth: document.documentElement.scrollWidth,
            viewport: innerWidth,
            main: { x: main.getBoundingClientRect().x, width: main.getBoundingClientRect().width },
            type: {
              family: getComputedStyle(main).fontFamily,
              numerals: getComputedStyle(main).fontVariantNumeric,
              heading: getComputedStyle(document.querySelector('h1')).fontSize,
            },
            iconCount: document.querySelectorAll('herald-icon').length,
            duplicateIcons: [...document.querySelectorAll('herald-icon')].filter(icon => icon.querySelectorAll('svg').length !== 1).length,
          };
        }),
      };
      if ([390, 1440].includes(width)) {
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        record.axe = result.violations.map(item => ({ id: item.id, impact: item.impact, count: item.nodes.length }));
      }
      report.pages.push(record);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4400/');
  report.interactions.loadingWidths = await page.locator('tbody tr').first().locator('button').evaluateAll(buttons =>
    buttons.map(button => ({ text: button.textContent.trim(), width: button.getBoundingClientRect().width, busy: button.getAttribute('aria-busy') })),
  );
  const trigger = page.locator('section[aria-labelledby="dialogs"]').getByRole('button', { name: 'Destructive confirmation', exact: true });
  await trigger.click();
  await expect(page.getByRole('button', { name: 'Keep entry', exact: true })).toBeFocused();
  report.interactions.dialog = { initialFocus: 'Keep entry' };
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  Object.assign(report.interactions.dialog, { escapeClosed: true, focusReturned: true });
  await page.locator('section[aria-labelledby="dialogs"]').getByRole('button', { name: 'Busy', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  report.interactions.busyEscapeIgnored = true;

  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('section[aria-labelledby="drawers"]').getByRole('button', { name: 'Default', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  report.interactions.narrowDrawer = await page.getByRole('dialog').boundingBox();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('section[aria-labelledby="toasts"]').getByRole('button', { name: 'Three stacked', exact: true }).click();
  await expect(page.locator('.herald-toast')).toHaveCount(3);
  await expect(page.locator('body')).not.toHaveCSS('padding-bottom', '0px');
  report.interactions.toasts = await page.locator('.herald-toast').count();
  report.interactions.toastReserve = await page.evaluate(() => getComputedStyle(document.body).paddingBottom);
  report.interactions.toastDismissNames = await page.locator('.herald-toast-dismiss').evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  report.interactions.reducedMotion = await page.locator('.herald-button-spinner').first().evaluate(element => getComputedStyle(element).animationDuration);

  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.goto('http://127.0.0.1:4300/');
  report.interactions.publicAlignment2560 = await page.evaluate(() => Object.fromEntries(
    ['.brand', '.hero h1', '.points h2', '.footer'].map(selector => [selector, document.querySelector(selector).getBoundingClientRect().x]),
  ));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  report.interactions.publicMenu = {
    expanded: await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'),
    signInVisible: true,
  };
  writeFileSync(new URL('browser-measurements.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Recorded ${report.pages.length} route/viewport samples and catalogue/public interactions.`);
} finally {
  await browser.close();
}
