import { DOCUMENT, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { PublicClientApplication, type AccountInfo, type IPublicClientApplication } from '@azure/msal-browser';

/** Read at start-up from /runtime-config.json: the directory's identifiers stay out of the repository (D-1). */
export interface AuthConfig {
  readonly authority: string;
  readonly clientId: string;
  readonly apiScope: string;
}

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('Herald admin sign-in configuration');

/** MSAL keeps tokens in sessionStorage: tokens only, never application data (D-9, recorded W-06 exception). */
export const MSAL_CLIENT = new InjectionToken<IPublicClientApplication>('Herald MSAL client', {
  factory: () => {
    const config = inject(AUTH_CONFIG);
    const origin = inject(DOCUMENT).location.origin;
    return new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        knownAuthorities: [new URL(config.authority).host],
        redirectUri: `${origin}/`,
        postLogoutRedirectUri: `${origin}/`,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
  },
});

/** The signed-in person as the directory issued them, and the tokens for Herald's API. */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly client = inject(MSAL_CLIENT);
  private readonly config = inject(AUTH_CONFIG);
  private readonly current = signal<AccountInfo | null>(null);

  readonly account = this.current.asReadonly();

  /** Completes a returning redirect; MSAL then navigates back to the address that asked to sign in (A-2). */
  async start(): Promise<void> {
    await this.client.initialize();
    const result = await this.client.handleRedirectPromise();
    const account = result?.account ?? this.client.getAllAccounts()[0] ?? null;
    if (account) this.client.setActiveAccount(account);
    this.current.set(account);
  }

  signIn(returnTo: string): Promise<void> {
    return this.client.loginRedirect({ scopes: [this.config.apiScope], redirectStartPage: returnTo });
  }

  signOut(): Promise<void> {
    return this.client.logoutRedirect({ account: this.current() });
  }

  async token(): Promise<string> {
    const account = this.current();
    if (!account) throw new Error('No signed-in person.');
    return (await this.client.acquireTokenSilent({ scopes: [this.config.apiScope], account })).accessToken;
  }
}
