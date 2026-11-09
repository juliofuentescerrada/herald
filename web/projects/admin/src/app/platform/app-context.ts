import { computed, DestroyRef, DOCUMENT, EnvironmentInjector, Injectable, InjectionToken, Injector, inject, provideAppInitializer, signal } from '@angular/core';
import { Session } from './session';

export interface ContextSnapshot {
  readonly identity: string | null;
  readonly organisation: string | null;
}

export const organisationPath = (id: string) => `/organisations/${id}`;

/** The working organisation is the one in the address: /organisations/<id>/... */
export const organisationInPath = (path: string): string | null =>
  /^\/organisations\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?=[/?#]|$)/i.exec(path)?.[1].toLowerCase() ?? null;

/** The context this document was loaded with: the signed-in person and the organisation in the address. */
export const INITIAL_CONTEXT = new InjectionToken<ContextSnapshot>('Herald initial context', {
  factory: () => ({
    identity: inject(Session).account()?.homeAccountId ?? null,
    organisation: organisationInPath(inject(DOCUMENT).location.pathname),
  }),
});

export const CONTEXT_LOCATION = new InjectionToken<Pick<Location, 'assign' | 'reload' | 'replace'>>('Herald context location', {
  factory: () => inject(DOCUMENT).location,
});

const channelName = 'herald-admin-context';
const replacedKey = 'herald-context-replaced';
const signedOut = 'signed-out';

/** Session storage survives the reload of this tab only; unavailable storage just loses the notice. */
const sessionStore = (document: Document): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null => {
  try {
    return document.defaultView?.sessionStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * Identity and organisation as read-only signals. The only way to change them is a full load
 * (W-06), which drops this document's query cache, signals, services and in-flight requests;
 * other tabs of this app reload too.
 */
@Injectable({ providedIn: 'root' })
export class AppContext {
  private readonly location = inject(CONTEXT_LOCATION);
  private readonly initial = inject(INITIAL_CONTEXT);
  private readonly channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(channelName);
  private readonly store = sessionStore(inject(DOCUMENT));
  private readonly injector = inject(Injector);

  readonly identity = signal(this.initial.identity).asReadonly();
  readonly organisation = signal(this.initial.organisation).asReadonly();
  /** The working organisation's overview, or `/` to resolve one. */
  readonly home = computed(() => {
    const id = this.organisation();
    return id ? organisationPath(id) : '/';
  });
  /** True once, in the document that loaded because another tab replaced the context. */
  readonly replacedElsewhere = signal(this.store?.getItem(replacedKey) === '1').asReadonly();

  constructor() {
    this.store?.removeItem(replacedKey);
    if (this.channel)
      this.channel.onmessage = async ({ data }: MessageEvent) => {
        // Each tab keeps its own session: after a sign-out elsewhere this one forgets it too, so it reloads signed out.
        if (data === signedOut) await this.injector.get(Session).forget();
        this.store?.setItem(replacedKey, '1');
        this.location.reload();
      };
    inject(DestroyRef).onDestroy(() => this.channel?.close());
  }

  /** Sign-out, a user change, revocation and an organisation change all come through here. */
  replace(target: string): void {
    this.channel?.postMessage('replaced');
    this.location.assign(target);
  }

  /**
   * Opens an organisation's workspace with a full load. Leaving another organisation is a replacement
   * (other tabs reload, A-4); entering from no organisation is not, and does not stay in the history.
   */
  enter(target: string): void {
    if (this.organisation() === null) this.location.replace(target);
    else this.replace(target);
  }

  /** Other tabs forget their session and reload first, then the directory ends the session and returns to the app. */
  signOut(): Promise<void> {
    this.channel?.postMessage(signedOut);
    return this.injector.get(Session).signOut();
  }
}

/**
 * Settles the session before the first navigation, so guards see a returning person, then creates the
 * context from it, which starts listening for replacements in other tabs.
 */
export const provideAppContext = () =>
  provideAppInitializer(() => {
    const injector = inject(EnvironmentInjector);
    return inject(Session)
      .start()
      .then(() => void injector.get(AppContext));
  });

/** Query keys start with their scope, so one key never means different data in two contexts. */
export const organisationKey = (organisation: string, ...parts: readonly unknown[]) =>
  ['org', organisation, ...parts] as const;
