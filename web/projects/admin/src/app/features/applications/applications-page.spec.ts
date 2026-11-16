import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GrantDetails, HeraldHostAdminService } from '@herald/api-client/admin';
import { Toasts } from '@herald/ui';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { Observable, of, throwError } from 'rxjs';
import { AccessState, AppContext, CONFIRM, QUERY_CLIENT, Session } from '../../platform';
import { ApplicationsPage } from './applications-page';

const organisation = '0198f000-0000-7000-8000-00000000000a';
const saturday = '0198f000-0000-7000-8000-0000000000f1';
const application = '0198f5ee-0000-4d21-9a55-1c0e8d6b2f41';

const active: GrantDetails = {
  id: 'g1',
  name: 'Results bot',
  applicationId: application,
  tournaments: [saturday],
  groups: ['read', 'results'],
  grantedBy: 'Alex Morgan',
  grantedAt: '2026-11-16T09:00:00Z',
  revokedBy: null,
  revokedAt: null,
};
const revoked: GrantDetails = { ...active, id: 'g0', name: 'Old scoreboard', tournaments: null, groups: ['read'], revokedBy: 'Alex Morgan', revokedAt: '2026-11-15T18:30:00Z' };

const problem = (status: number, body: object = {}) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

async function open(api: Record<string, unknown>, confirm: () => Promise<boolean> = () => Promise.resolve(true)) {
  const client = new QueryClient();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'organisations/:organisationId/applications', component: ApplicationsPage }]),
      provideTanStackQuery(client),
      { provide: QUERY_CLIENT, useValue: client },
      { provide: AppContext, useValue: { organisation: signal(organisation), home: signal(`/organisations/${organisation}`) } },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      { provide: AccessState, useValue: { problem: signal(null) } },
      { provide: CONFIRM, useValue: confirm },
      {
        provide: HeraldHostAdminService,
        useValue: {
          getOrganisation: () => of({ id: organisation, name: 'Northside Gaming' }),
          listTournaments: () => of([{ id: saturday, title: 'Saturday Open' }, { id: 't2', title: 'Sunday Cup' }]),
          ...api,
        },
      },
    ],
  });
  const harness = await RouterTestingHarness.create(`/organisations/${organisation}/applications`);
  document.body.appendChild(harness.fixture.nativeElement);
  const all = () => document.body;
  const clean = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim();
  return {
    page: () => harness.routeNativeElement as HTMLElement,
    settle: () => harness.fixture.whenStable(),
    button: (text: string) => [...all().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!,
    text: (selector: string) => clean(all().querySelector(selector)),
    texts: (selector: string) => [...all().querySelectorAll(selector)].map(clean),
    toasts: () => TestBed.inject(Toasts).toasts().map((toast) => toast.text),
    type: (selector: string, value: string) => {
      const input = all().querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    },
    check: (label: string) => {
      const input = [...all().querySelectorAll('label')].find((l) => clean(l)?.startsWith(label))!.querySelector('input')!;
      input.click();
    },
  };
}

const violations = async (element: HTMLElement) =>
  (await axe.run(element, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

describe('The applications page', () => {
  afterEach(() => {
    document.querySelectorAll('herald-dialog').forEach((element) => element.remove());
    TestBed.resetTestingModule();
  });

  it('says no application has access, with granting as its action (apps-empty)', async () => {
    const { page, text, texts } = await open({ listGrants: () => of([]) });
    await vi.waitFor(() => expect(text('herald-notice')).toContain('No application has access'));
    expect(texts('button')).toEqual(['Grant access']);
    expect(await violations(page())).toEqual([]);
  });

  it('lists an active and a revoked grant with scope, groups and who changed them (apps-list)', { meta: { type: 'covers', description: 'pilot-access: Granting results for one tournament' } }, async () => {
    const { page } = await open({ listGrants: () => of([active, revoked]) });
    await vi.waitFor(() => expect(page().querySelectorAll('li')).toHaveLength(2));
    const [first, second] = page().querySelectorAll('li');

    expect(first.querySelector('h3')?.textContent).toBe('Results bot');
    expect(first.querySelector('.identity herald-status-label')?.textContent?.trim()).toBe('Active');
    expect(first.textContent).toContain(`${application} · Saturday Open`);
    expect([...first.querySelectorAll('.labels herald-status-label')].map((l) => l.textContent?.trim())).toEqual(['Read', 'Results and corrections']);
    expect(first.querySelector('button')?.getAttribute('aria-label')).toBe('Revoke: Results bot');

    expect(second.querySelector('.identity herald-status-label')?.textContent?.trim()).toBe('Revoked');
    expect(second.textContent).toContain('All tournaments');
    expect(second.textContent).toContain('Revoked by Alex Morgan');
    expect(second.querySelector('button')).toBeNull();
    expect(await violations(page())).toEqual([]);
  });

  it('grants the chosen tournaments and operations and lists the grant (apps-grant)', async () => {
    let sent: { id: string; body: object } | null = null;
    const listed: GrantDetails[] = [];
    const { button, check, text, toasts, type, page } = await open({
      listGrants: () => of(listed),
      grantApplication: (_: string, id: string, body: object) => {
        sent = { id, body };
        return of(active);
      },
    });
    await vi.waitFor(() => expect(button('Grant access')).toBeDefined());
    button('Grant access').click();
    await vi.waitFor(() => expect(text('herald-dialog h2')).toBe('Grant access'));
    expect(await violations(document.querySelector('herald-dialog') as HTMLElement)).toEqual([]);

    type('#grant-name', ' Results bot ');
    type('#grant-id', application);
    check('Selected tournaments');
    await vi.waitFor(() => expect(text('.nested')).toContain('Saturday Open'));
    check('Saturday Open');
    check('Results and corrections');
    check('Read');
    [...document.querySelectorAll<HTMLButtonElement>('herald-dialog button')].find((b) => b.textContent?.trim() === 'Grant access')!.click();

    await vi.waitFor(() => expect(toasts()).toEqual(['Results bot can act within its grant.']));
    expect(sent!.body).toEqual({ name: 'Results bot', applicationId: application, tournaments: [saturday], groups: ['read', 'results'] });
    await vi.waitFor(() => expect(page().querySelector('li h3')?.textContent).toBe('Results bot'));
  });

  it('names each missing or invalid field and sends nothing (apps-grant-errors)', async () => {
    const grantApplication = vi.fn();
    const { button, check, texts, type } = await open({ listGrants: () => of([]), grantApplication });
    await vi.waitFor(() => expect(button('Grant access')).toBeDefined());
    button('Grant access').click();
    await vi.waitFor(() => expect(document.querySelector('#grant-name')).not.toBeNull());
    type('#grant-id', 'results-bot');
    check('Selected tournaments');
    [...document.querySelectorAll<HTMLButtonElement>('herald-dialog button')].find((b) => b.textContent?.trim() === 'Grant access')!.click();

    await vi.waitFor(() =>
      expect(texts('herald-dialog .field-error')).toEqual([
        'Error: Give the application a name.',
        'Error: Enter the identifier as given: 32 hexadecimal digits with hyphens.',
        'Error: Choose at least one tournament, or all of them.',
        'Error: Choose at least one operation.',
      ]),
    );
    expect(document.querySelector('#grant-name')?.getAttribute('aria-invalid')).toBe('true');
    expect(grantApplication).not.toHaveBeenCalled();
    expect(await violations(document.querySelector('herald-dialog') as HTMLElement)).toEqual([]);
  });

  it('says an application with an active grant must be revoked first, keeping the input', async () => {
    const { button, check, text, type } = await open({
      listGrants: () => of([]),
      grantApplication: (): Observable<never> => throwError(() => problem(409, { type: 'application-already-granted' })),
    });
    await vi.waitFor(() => expect(button('Grant access')).toBeDefined());
    button('Grant access').click();
    await vi.waitFor(() => expect(document.querySelector('#grant-name')).not.toBeNull());
    type('#grant-name', 'Results bot');
    type('#grant-id', application);
    check('Read');
    [...document.querySelectorAll<HTMLButtonElement>('herald-dialog button')].find((b) => b.textContent?.trim() === 'Grant access')!.click();

    await vi.waitFor(() => expect(text('herald-dialog herald-notice')).toContain('Revoke its grant first'));
    expect(document.querySelector<HTMLInputElement>('#grant-name')?.value).toBe('Results bot');
  });

  it('asks before revoking, then lists the grant as revoked (apps-revoke)', { meta: { type: 'covers', description: 'pilot-access: Revoking' } }, async () => {
    const confirm = vi.fn(() => Promise.resolve(true));
    const { button, page, toasts } = await open(
      { listGrants: () => of([active]), revokeGrant: () => of({ ...active, revokedBy: 'Alex Morgan', revokedAt: '2026-11-16T10:00:00Z' }) },
      confirm,
    );
    await vi.waitFor(() => expect(button('Revoke')).toBeDefined());
    button('Revoke').click();

    await vi.waitFor(() => expect(toasts()).toEqual(['Results bot no longer has access.']));
    expect(confirm).toHaveBeenCalledWith({
      heading: 'Revoke Results bot?',
      body: 'Results bot stops acting for Northside Gaming from its next request. Results it recorded stay, attributed to it.',
      confirmLabel: 'Revoke',
      leaveLabel: 'Keep access',
      destructive: true,
    });
    await vi.waitFor(() => expect(page().querySelector('.identity herald-status-label')?.textContent?.trim()).toBe('Revoked'));
    expect(page().textContent).toContain('Revoked by Alex Morgan');
  });

  it('keeps the grant when the revocation is declined', async () => {
    const revokeGrant = vi.fn();
    const { button, page } = await open({ listGrants: () => of([active]), revokeGrant }, () => Promise.resolve(false));
    await vi.waitFor(() => expect(button('Revoke')).toBeDefined());
    button('Revoke').click();
    await new Promise((resolve) => setTimeout(resolve));

    expect(revokeGrant).not.toHaveBeenCalled();
    expect(page().querySelector('.identity herald-status-label')?.textContent?.trim()).toBe('Active');
  });

  it('offers to try again when the list does not load', async () => {
    const { text, button } = await open({ listGrants: () => throwError(() => problem(500)) });
    await vi.waitFor(() => expect(text('herald-notice')).toContain('Applications did not load'));
    expect(button('Try again')).toBeDefined();
  });
});
