import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Session } from './session';
import { apiToken, signedIn } from './sign-in';

function setUp(account: { username: string } | null) {
  const session = { account: signal(account), signIn: vi.fn(async () => undefined), token: vi.fn(async () => 'token-1') };
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
});
