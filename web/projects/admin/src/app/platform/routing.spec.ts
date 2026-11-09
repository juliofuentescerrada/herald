import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { of } from 'rxjs';
import { CONTEXT_LOCATION, INITIAL_CONTEXT } from './app-context';
import { inOrganisation, resolveHome } from './routing';

const northside = '0198f000-0000-7000-8000-00000000000a';
const southside = '0198f000-0000-7000-8000-00000000000b';

function setUp(organisation: string | null, owned: string[] = []) {
  const location = { assign: vi.fn(), reload: vi.fn(), replace: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: INITIAL_CONTEXT, useValue: { identity: 'ana', organisation } },
      { provide: CONTEXT_LOCATION, useValue: location },
      { provide: HeraldHostAdminService, useValue: { getMe: () => of({ displayName: 'Ana', organisations: owned.map((id) => ({ id, name: id })) }) } },
    ],
  });
  return location;
}

const home = () => TestBed.runInInjectionContext(() => resolveHome({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as Promise<boolean | UrlTree>;
const open = (id: string) =>
  TestBed.runInInjectionContext(() =>
    inOrganisation({ paramMap: convertToParamMap({ organisationId: id }) } as ActivatedRouteSnapshot, { url: `/organisations/${id}` } as RouterStateSnapshot),
  );

describe('Resolving the admin home', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sends a person with no organisation to creation', async () => {
    setUp(null);
    expect(String(await home())).toBe('/organisations/new');
  });

  it('sends a person with several organisations to the selector', async () => {
    setUp(null, [northside, southside]);
    expect(String(await home())).toBe('/organisations');
  });

  it('opens the only organisation with a full load that leaves no history entry and no other tab reloading', async () => {
    const location = setUp(null, [northside]);
    const channel = new BroadcastChannel('herald-admin-context');
    const heard = vi.fn();
    channel.onmessage = heard;

    expect(await home()).toBe(false);
    expect(location.replace).toHaveBeenCalledWith(`/organisations/${northside}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heard).not.toHaveBeenCalled();
    channel.close();
  });
});

describe('An organisation workspace', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('opens the organisation this document was loaded for', () => {
    setUp(northside);
    expect(open(northside.toUpperCase())).toBe(true);
  });

  it('opens another organisation as a replacement, with a full load', () => {
    const location = setUp(northside);
    expect(open(southside)).toBe(false);
    expect(location.assign).toHaveBeenCalledWith(`/organisations/${southside}`);
  });

  it('enters an organisation from a document without one', () => {
    const location = setUp(null);
    expect(open(northside)).toBe(false);
    expect(location.replace).toHaveBeenCalledWith(`/organisations/${northside}`);
    expect(location.assign).not.toHaveBeenCalled();
  });
});

describe('The working context', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('signs out after telling the other tabs', async () => {
    const signOut = vi.fn(async () => undefined);
    setUp(northside);
    const { AppContext, Session } = await import('./index');
    TestBed.overrideProvider(Session, { useValue: { account: signal(null), signOut } });
    const channel = new BroadcastChannel('herald-admin-context');
    const heard = new Promise((resolve) => (channel.onmessage = resolve));

    await TestBed.inject(AppContext).signOut();

    expect(signOut).toHaveBeenCalledOnce();
    await heard;
    channel.close();
  });
});
