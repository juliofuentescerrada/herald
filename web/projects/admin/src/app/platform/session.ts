import { DOCUMENT, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { ProtocolMode, PublicClientApplication, type AccountInfo, type IPublicClientApplication } from '@azure/msal-browser';
import { AccessProblem, signInProblem } from './access';

/** Read at start-up from /runtime-config.json: the directory's identifiers stay out of the repository (D-1). */
export interface AuthConfig {
  readonly authority: string;
  readonly clientId: string;
  readonly apiScope: string;
  /** The public application, for "Back to public page"; optional in development. */
  readonly publicUrl?: string;
  /** `OIDC` for a provider that is not Microsoft's, such as the end-to-end suite's (ADR 0015); absent for the directory. */
  readonly protocolMode?: 'OIDC';
  /** Hosts MSAL may trust besides the authority's own; absent, the authority's host. */
  readonly knownAuthorities?: readonly string[];
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
        knownAuthorities: [...(config.knownAuthorities ?? [new URL(config.authority).host])],
        redirectUri: `${origin}/`,
        postLogoutRedirectUri: `${origin}/`,
      },
      cache: { cacheLocation: 'sessionStorage' },
      // Without OIDC mode MSAL treats the authority as Microsoft's and appends /v2.0 to it.
      ...(config.protocolMode === 'OIDC' ? { system: { protocolMode: ProtocolMode.OIDC } } : {}),
    });
  },
});

/** The signed-in person as the directory issued them, and the tokens for Herald's API. */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly client = inject(MSAL_CLIENT);
  private readonly config = inject(AUTH_CONFIG);
  private readonly current = signal<AccountInfo | null>(null);
  private readonly failed = signal<AccessProblem | null>(null);

  readonly account = this.current.asReadonly();
  /** Why the returning sign-in did not complete, if it did not. */
  readonly failure = this.failed.asReadonly();

  /** Completes a returning redirect; MSAL then navigates back to the address that asked to sign in (A-2). */
  async start(): Promise<void> {
    await this.client.initialize();
    const result = await this.client.handleRedirectPromise().catch((error: unknown) => {
      this.failed.set(signInProblem(error));
      return null;
    });
    const account = result?.account ?? this.client.getAllAccounts()[0] ?? null;
    if (account) this.client.setActiveAccount(account);
    this.current.set(account);
  }

  /** `anotherAccount` asks the directory to offer account selection instead of reusing its session. */
  signIn(returnTo: string, anotherAccount = false): Promise<void> {
    return this.client.loginRedirect({
      scopes: [this.config.apiScope],
      redirectStartPage: returnTo,
      ...(anotherAccount ? { prompt: 'select_account' } : {}),
    });
  }

  signOut(): Promise<void> {
    return this.client.logoutRedirect({ account: this.current() });
  }

  /** Drops this tab's tokens and account without asking the directory: the session already ended in another tab. */
  forget(): Promise<void> {
    return this.client.clearCache();
  }

  async token(): Promise<string> {
    const account = this.current();
    if (!account) throw new Error('No signed-in person.');
    return (await this.client.acquireTokenSilent({ scopes: [this.config.apiScope], account })).accessToken;
  }
}
