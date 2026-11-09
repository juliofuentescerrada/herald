import AxeBuilder from '@axe-core/playwright';
import { expect, test as base, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { audience, authority } from './environment.ts';

export interface Persona {
  readonly oid: string;
  readonly name: string;
  readonly roles: readonly string[];
}

export interface SignInOptions {
  /** Where the admin application is opened; the guard sends the person to sign in first. */
  readonly path?: string;
  /** False for a person the directory knows but who is not assigned to Herald: no `Organiser` role. */
  readonly assigned?: boolean;
  /** The tab to sign in; the test's page by default. */
  readonly on?: Page;
  /**
   * Signs in again as this persona, for example in a second tab: MSAL keeps its cache per tab, and the test
   * provider has no single sign-on session to renew it silently as the directory does.
   */
  readonly as?: Persona;
}

interface Fixtures {
  /** Signs in as a fresh persona (new object id and name) through the provider's login form. */
  signIn: (options?: SignInOptions) => Promise<Persona>;
  /** A second tab in the same browser context: it shares the BroadcastChannel; sign it in with `signIn({ on, as })`. */
  secondPage: Page;
  /** Fails on any accessibility violation in the page's current state; contrast is reviewed on the mockups. */
  expectAccessible: (target?: Page) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  signIn: async ({ page }, use) => {
    await use(async ({ path = '/', assigned = true, on = page, as } = {}) => {
      const id = randomUUID();
      const persona: Persona = as ?? { oid: id, name: `Persona ${id.slice(0, 8)}`, roles: assigned ? ['Organiser'] : [] };

      await on.goto(path);
      await on.waitForURL((url) => url.href.startsWith(authority));
      // The provider puts these claims, as the directory names them, into the access token; it sets `tid` itself.
      await on.locator('[name=username]').fill(persona.name);
      await on.locator('[name=claims]').fill(JSON.stringify({ ...persona, aud: audience }));
      await on.getByRole('button', { name: 'Sign-in' }).click();
      await on.waitForURL((url) => !url.href.startsWith(authority));
      return persona;
    });
  },
  secondPage: async ({ context }, use) => {
    const second = await context.newPage();
    await use(second);
    await second.close();
  },
  expectAccessible: async ({ page }, use) => {
    await use(async (target = page) => {
      const results = await new AxeBuilder({ page: target }).disableRules(['color-contrast']).analyze();
      expect(results.violations).toEqual([]);
    });
  },
});

export { expect };
