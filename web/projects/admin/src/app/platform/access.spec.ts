import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthError } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';
import { accessErrors, AccessState, CONFIRM, confirmLeave, signInProblem } from './access';
import { QUERY_CLIENT } from './query-client';

describe('A sign-in that did not complete', () => {
  it('is an unassigned account when the directory says so', () =>
    expect(signInProblem(new AuthError('access_denied', 'correlation', 'AADSTS50105: The signed in user is not assigned to a role.'))).toBe('not-assigned'));

  it.each(['user_cancelled', 'access_denied'])('is cancelled for %s', (code) => expect(signInProblem(new AuthError(code, 'correlation', 'cancelled'))).toBe('sign-in-cancelled'));

  it('is a failure otherwise', () => expect(signInProblem(new AuthError('server_error', 'correlation', 'AADSTS90002'))).toBe('sign-in-failed'));
});

@Component({ selector: 'app-draft-form', template: '' })
class DraftForm {
  readonly text = signal('');
  constructor() {
    inject(AccessState).keepDraft(() => this.text());
  }
}

describe('Losing access', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([accessErrors])), provideHttpClientTesting()] }));
  afterEach(() => TestBed.resetTestingModule());

  it('drops loaded private data and keeps only what the person typed', () => {
    const queries = TestBed.inject(QUERY_CLIENT);
    queries.setQueryData(['org', 'northside', 'summary'], { name: 'Northside Gaming' });
    const form = TestBed.createComponent(DraftForm);
    form.componentInstance.text.set('  Spring league notes ');
    const access = TestBed.inject(AccessState);

    access.report('session-expired');

    expect(queries.getQueryCache().getAll()).toHaveLength(0);
    expect(access.unsavedInput()).toBe('Spring league notes');
  });

  it('forgets a form that is gone', () => {
    const form = TestBed.createComponent(DraftForm);
    form.componentInstance.text.set('Gone');
    form.destroy();
    const access = TestBed.inject(AccessState);
    access.report('unavailable');
    expect(access.unsavedInput()).toBe('');
  });

  async function answer(url: string, status: number, body: object | null = null) {
    const request = firstValueFrom(TestBed.inject(HttpClient).get(url)).catch(() => undefined);
    TestBed.inject(HttpTestingController).expectOne(url).flush(body, { status, statusText: 'error' });
    await request;
    return TestBed.inject(AccessState).problem();
  }

  it('expires the session on 401', async () => expect(await answer('/api/me', 401)).toBe('session-expired'));
  it('reports an unassigned account on 403', async () => expect(await answer('/api/me', 403)).toBe('not-assigned'));
  it('shows the generic denial for an organisation that is not available', async () =>
    expect(await answer('/api/organisations/x', 404, { type: 'organisation-not-available' })).toBe('unavailable'));
  it('leaves other not-found answers to the page', async () => expect(await answer('/api/organisations/x/tournaments/1', 404, { type: 'other' })).toBeNull());
  it('ignores answers from outside Herald API', async () => expect(await answer('/runtime-config.json', 401)).toBeNull());
});

describe('Leaving a form', () => {
  afterEach(() => TestBed.resetTestingModule());

  const leave = () => TestBed.runInInjectionContext(() => confirmLeave(null, {} as never, {} as never, {} as never));

  it('does not ask without unsaved input', () => {
    const confirm = vi.fn(() => false);
    TestBed.configureTestingModule({ providers: [{ provide: CONFIRM, useValue: confirm }] });
    const form = TestBed.createComponent(DraftForm);
    form.componentInstance.text.set('   ');
    expect(leave()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([true, false])('asks before discarding unsaved input and respects the answer (%s)', async (answer) => {
    TestBed.configureTestingModule({ providers: [{ provide: CONFIRM, useValue: () => Promise.resolve(answer) }] });
    TestBed.createComponent(DraftForm).componentInstance.text.set('Spring league');
    expect(await leave()).toBe(answer);
  });
});
