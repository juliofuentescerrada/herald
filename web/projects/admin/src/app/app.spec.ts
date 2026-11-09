import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import axe from 'axe-core';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { CONTEXT_LOCATION, INITIAL_CONTEXT, Session } from './platform';
import { App } from './app';
import { routes } from './app.routes';

/** Stands in for a lazy section whose files a new release removed. */
const failingSection: Routes = [
  { path: 'tournaments', loadComponent: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module')) },
];

const northside = '0198f000-0000-7000-8000-00000000000a';
const southside = '0198f000-0000-7000-8000-00000000000b';
const names: Record<string, string> = { [northside]: 'Northside Gaming', [southside]: 'Southside Club' };
const api = { getOrganisation: (id: string) => of({ id, name: names[id] }) };

async function openShell(url: string, organisation: string | null = northside) {
  const location = { assign: vi.fn(), reload: vi.fn(), replace: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([...failingSection, ...routes]),
      { provide: INITIAL_CONTEXT, useValue: { identity: 'ana', organisation } },
      { provide: CONTEXT_LOCATION, useValue: location },
      // A signed-in person: the sign-in guard is covered in platform/sign-in.spec.ts.
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: HeraldHostAdminService, useValue: api },
      provideTanStackQuery(new QueryClient()),
    ],
  });
  const fixture = TestBed.createComponent(App);
  document.body.appendChild(fixture.nativeElement);
  const router = TestBed.inject(Router);
  const navigate = async (target: string) => {
    await router.navigateByUrl(target).catch(() => undefined);
    await fixture.whenStable();
  };
  await navigate(url);
  const element = fixture.nativeElement as HTMLElement;
  return { element, navigate, location, text: (selector: string) => element.querySelector(selector)?.textContent?.trim() };
}

describe('The admin shell', () => {
  beforeEach(() => sessionStorage.clear());

  it('shows the working organisation and marks the current page', async () => {
    const { text } = await openShell(`/organisations/${northside}`);
    expect(text('.context-name')).toBe('Northside Gaming');
    expect(text('nav[aria-label="Workspace"] [aria-current="page"]')).toBe('Overview');
    expect(text('h1')).toBe('Overview');
  });

  it('says when no organisation is selected', async () => {
    const { text } = await openShell('/organisations', null);
    expect(text('.context-name')).toBe('No organisation selected');
    expect(text('h1')).toBe('Choose an organisation');
  });

  it('answers an unknown address with a generic page inside the shell', async () => {
    const { text, element } = await openShell(`/organisations/${northside}/tournaments/42/secret`);
    expect(text('h1')).toBe('Page not found in Northside Gaming');
    expect(element.querySelector('nav[aria-label="Workspace"]')).not.toBeNull();
  });

  it('offers a reload when a section fails to load, and clears it after leaving', async () => {
    const { text, element, navigate } = await openShell('/tournaments');
    expect(text('h1')).toBe('This section did not load');
    expect(document.activeElement).toBe(element.querySelector('h1'));
    // The reload goes through the document's location; jsdom cannot navigate, so only the button is checked.
    expect(element.querySelector('.failure button')?.textContent?.trim()).toBe('Reload page');

    await navigate(`/organisations/${northside}`);
    expect(text('h1')).toBe('Overview');
  });

  it('explains once that another tab replaced the context', async () => {
    sessionStorage.setItem('herald-context-replaced', '1');
    const { text, element, navigate } = await openShell(`/organisations/${southside}`, southside);
    await vi.waitFor(() => expect(text('herald-notice[role="status"] strong')).toBe('You are now working in Southside Club.'));

    (element.querySelector('.herald-notice-dismiss') as HTMLButtonElement).click();
    await navigate(`/organisations/${southside}`);
    expect(element.querySelector('herald-notice')).toBeNull();
    expect(sessionStorage.getItem('herald-context-replaced')).toBeNull();
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { element } = await openShell(`/organisations/${northside}`);
    const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
