import { createEnvironmentInjector, EnvironmentInjector, Injectable, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AppContext, CONTEXT_LOCATION, ContextSnapshot, INITIAL_CONTEXT, organisationKey } from './app-context';
import { QUERY_CLIENT } from './query-client';

/** Stands in for a feature's local draft state. */
@Injectable({ providedIn: 'root' })
class DraftFixture {
  readonly draft = signal('');
}

const fakeLocation = () => ({ assign: vi.fn(), reload: vi.fn() });

/** A document: a root injector with its own context and location, as a full load creates. */
function loadDocument(context: ContextSnapshot, location = fakeLocation()) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: INITIAL_CONTEXT, useValue: context },
      { provide: CONTEXT_LOCATION, useValue: location },
    ],
  });
  return { location, context: TestBed.inject(AppContext), queries: TestBed.inject(QUERY_CLIENT), drafts: TestBed.inject(DraftFixture) };
}

describe('The admin context', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('exposes identity and organisation without a way to set them', () => {
    const { context } = loadDocument({ identity: 'ana', organisation: 'northside' });
    expect(context.identity()).toBe('ana');
    expect(context.organisation()).toBe('northside');
    expect('set' in context.organisation).toBe(false);
  });

  it('replaces the context with a full load of the target', () => {
    const { context, location } = loadDocument({ identity: 'ana', organisation: 'northside' });
    context.replace('/?organisation=southside');
    expect(location.assign).toHaveBeenCalledWith('/?organisation=southside');
  });

  it('leaves no cached data or draft from the previous organisation after the load', () => {
    const before = loadDocument({ identity: 'ana', organisation: 'northside' });
    before.queries.setQueryData(organisationKey('northside', 'tournaments'), ['Spring league']);
    before.drafts.draft.set('Unsent name');
    before.context.replace('/?organisation=southside');

    const after = loadDocument({ identity: 'ana', organisation: 'southside' });
    expect(after.queries).not.toBe(before.queries);
    expect(after.queries.getQueryCache().getAll()).toHaveLength(0);
    expect(after.drafts.draft()).toBe('');
  });

  it('reloads the other tabs of the app when one replaces the context', async () => {
    const tab = (location: ReturnType<typeof fakeLocation>) =>
      createEnvironmentInjector(
        [
          { provide: INITIAL_CONTEXT, useValue: { identity: 'ana', organisation: 'northside' } },
          { provide: CONTEXT_LOCATION, useValue: location },
          AppContext,
        ],
        TestBed.inject(EnvironmentInjector),
      );
    const first = fakeLocation();
    const second = fakeLocation();
    const firstTab = tab(first);
    const secondTab = tab(second);
    const firstContext = firstTab.get(AppContext);
    secondTab.get(AppContext);

    firstContext.replace('/sign-in');
    await vi.waitFor(() => expect(second.reload).toHaveBeenCalledOnce());
    expect(first.reload).not.toHaveBeenCalled();
    firstTab.destroy();
    secondTab.destroy();
  });

  it('tells the reloaded tab once that the context was replaced elsewhere', () => {
    sessionStorage.clear();
    const before = loadDocument({ identity: 'ana', organisation: 'northside' });
    expect(before.context.replacedElsewhere()).toBe(false);
    before.context['channel']?.onmessage?.(new MessageEvent('message', { data: 'replaced' }));
    expect(before.location.reload).toHaveBeenCalledOnce();

    expect(loadDocument({ identity: 'ana', organisation: 'southside' }).context.replacedElsewhere()).toBe(true);
    expect(loadDocument({ identity: 'ana', organisation: 'southside' }).context.replacedElsewhere()).toBe(false);
  });
});

describe('Organisation query keys', () => {
  it('start with their scope', () => {
    expect(organisationKey('northside', 'tournaments', 3)).toEqual(['org', 'northside', 'tournaments', 3]);
  });

  it('are distinct for the same data in two organisations', () => {
    const client = new QueryClient();
    client.setQueryData(organisationKey('northside', 'tournaments'), 'n');
    expect(client.getQueryData(organisationKey('southside', 'tournaments'))).toBeUndefined();
  });
});
