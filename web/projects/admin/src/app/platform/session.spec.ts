import { TestBed } from '@angular/core/testing';
import { AuthError, InteractionRequiredAuthError } from '@azure/msal-browser';
import { AUTH_CONFIG, MSAL_CLIENT, Session } from './session';

const ana = { homeAccountId: 'ana.directory', username: 'ana@example.test', name: 'Ana Ruiz' };

function setUp(redirect: () => Promise<unknown> = async () => null, accounts: unknown[] = []) {
  const client = {
    initialize: vi.fn(async () => undefined),
    handleRedirectPromise: vi.fn(redirect),
    getAllAccounts: vi.fn(() => accounts),
    setActiveAccount: vi.fn(),
    loginRedirect: vi.fn(async () => undefined),
    logoutRedirect: vi.fn(async () => undefined),
    acquireTokenSilent: vi.fn(async () => ({ accessToken: 'token-1' })),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: MSAL_CLIENT, useValue: client },
      { provide: AUTH_CONFIG, useValue: { authority: 'https://d.example/', clientId: 'c', apiScope: 'api://herald/access_as_user' } },
    ],
  });
  return { client, session: TestBed.inject(Session) };
}

describe('The admin session', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('completes a returning sign-in and keeps the person', async () => {
    const { client, session } = setUp(async () => ({ account: ana }));
    await session.start();
    expect(client.initialize).toHaveBeenCalledBefore(client.handleRedirectPromise);
    expect(client.setActiveAccount).toHaveBeenCalledWith(ana);
    expect(session.account()).toBe(ana);
    expect(session.failure()).toBeNull();
  });

  it('keeps a person already signed in in this tab', async () => {
    const { session } = setUp(async () => null, [ana]);
    await session.start();
    expect(session.account()).toBe(ana);
  });

  it('records why a returning sign-in failed instead of throwing', async () => {
    const { session } = setUp(async () => Promise.reject(new AuthError('access_denied', 'c', 'AADSTS50105: not assigned')));
    await session.start();
    expect(session.account()).toBeNull();
    expect(session.failure()).toBe('not-assigned');
  });

  it('signs in for Herald API and returns to the requested address', async () => {
    const { client, session } = setUp();
    await session.signIn('/organisations/1?tab=rounds');
    expect(client.loginRedirect).toHaveBeenCalledWith({ scopes: ['api://herald/access_as_user'], redirectStartPage: '/organisations/1?tab=rounds' });
  });

  it('asks the directory to choose another account when asked to', async () => {
    const { client, session } = setUp();
    await session.signIn('/', true);
    expect(client.loginRedirect).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'select_account' }));
  });

  it('signs out of the directory, which ends this document with a full load', async () => {
    const { client, session } = setUp(async () => ({ account: ana }));
    await session.start();
    await session.signOut();
    expect(client.logoutRedirect).toHaveBeenCalledWith({ account: ana });
  });

  it('gets tokens silently for the signed-in person only', async () => {
    const { client, session } = setUp(async () => ({ account: ana }));
    await expect(session.token()).rejects.toThrow('No signed-in person.');
    await session.start();
    expect(await session.token()).toBe('token-1');
    expect(client.acquireTokenSilent).toHaveBeenCalledWith({ scopes: ['api://herald/access_as_user'], account: ana });
  });

  it('lets a token that needs interaction fail, for the caller to treat as expiry', async () => {
    const { client, session } = setUp(async () => ({ account: ana }));
    await session.start();
    client.acquireTokenSilent.mockRejectedValueOnce(new InteractionRequiredAuthError('interaction_required', 'correlation'));
    await expect(session.token()).rejects.toBeInstanceOf(InteractionRequiredAuthError);
  });
});
