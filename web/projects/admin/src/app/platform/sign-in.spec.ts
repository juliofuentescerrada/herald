import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AccessState } from './access';
import { Session } from './session';
import { apiToken, signedIn } from './sign-in';

function setUp(account: { username: string } | null, failure: string | null = null, token = vi.fn(async () => 'token-1')) {
  const session = { account: signal(account), failure: signal(failure), signIn: vi.fn(async () => undefined), token };
  TestBed.configureTestingModule({
    providers: [
      { provide: Session, useValue: session },
      provideHttpClient(withInterceptors([apiToken])),
      provideHttpClientTesting(),
    ],
  });
  return session;
}

const visit = (url: string) =>
  TestBed.runInInjectionContext(() => signedIn({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

describe('Admin sign-in', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('lets a signed-in person through', async () => {
    const session = setUp({ username: 'ana' });
    expect(await visit('/organisations/1')).toBe(true);
    expect(session.signIn).not.toHaveBeenCalled();
  });

  it('sends a visitor to sign in and back to the address they asked for', async () => {
    const session = setUp(null);
    expect(await visit('/organisations/1?tab=rounds')).toBe(false);
    expect(session.signIn).toHaveBeenCalledWith('/organisations/1?tab=rounds');
  });


  it.each(['/api/me', '/api'])('sends the bearer token with %s', async (url) => {
    setUp({ username: 'ana' });
    const done = firstValueFrom(TestBed.inject(HttpClient).get(url));
    const http = TestBed.inject(HttpTestingController);
    await vi.waitFor(() => {
      const call = http.expectOne(url);
      expect(call.request.headers.get('Authorization')).toBe('Bearer token-1');
      call.flush({});
    });
    await done;
  });

  it.each(['/runtime-config.json', 'https://elsewhere.example/api/me', '/apis'])('never sends a token to %s', async (url) => {
    const session = setUp({ username: 'ana' });
    const done = firstValueFrom(TestBed.inject(HttpClient).get(url));
    const call = TestBed.inject(HttpTestingController).expectOne(url);
    expect(call.request.headers.has('Authorization')).toBe(false);
    call.flush({});
    await done;
    expect(session.token).not.toHaveBeenCalled();
  });

  it('shows why a returning sign-in failed instead of going straight back to the directory', async () => {
    const session = setUp(null, 'not-assigned');
    expect(await visit('/')).toBe(false);
    expect(session.signIn).not.toHaveBeenCalled();
    expect(TestBed.inject(AccessState).problem()).toBe('not-assigned');
  });

  it('says it is taking the visitor to sign in', async () => {
    setUp(null);
    await visit('/');
    expect(TestBed.inject(AccessState).problem()).toBe('signing-in');
  });

  it('treats a token that needs interaction as an expired session', async () => {
    setUp({ username: 'ana' }, null, vi.fn(async () => Promise.reject(new Error('interaction_required'))));
    await expect(firstValueFrom(TestBed.inject(HttpClient).get('/api/me'))).rejects.toThrow('interaction_required');
    expect(TestBed.inject(AccessState).problem()).toBe('session-expired');
  });
});
