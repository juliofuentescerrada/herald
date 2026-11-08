import { DestroyRef, DOCUMENT, Injectable, InjectionToken, inject, provideAppInitializer, signal } from '@angular/core';

export interface ContextSnapshot {
  readonly identity: string | null;
  readonly organisation: string | null;
}

/** The context this document was loaded with. From H1 it comes from the URL and the session. */
export const INITIAL_CONTEXT = new InjectionToken<ContextSnapshot>('Herald initial context', {
  factory: () => ({ identity: null, organisation: null }),
});

export const CONTEXT_LOCATION = new InjectionToken<Pick<Location, 'assign' | 'reload'>>('Herald context location', {
  factory: () => inject(DOCUMENT).location,
});

const channelName = 'herald-admin-context';
const replacedKey = 'herald-context-replaced';

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

  readonly identity = signal(this.initial.identity).asReadonly();
  readonly organisation = signal(this.initial.organisation).asReadonly();
  /** True once, in the document that loaded because another tab replaced the context. */
  readonly replacedElsewhere = signal(this.store?.getItem(replacedKey) === '1').asReadonly();

  constructor() {
    this.store?.removeItem(replacedKey);
    if (this.channel)
      this.channel.onmessage = () => {
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
}

/** Starts listening for replacements in other tabs as soon as the app boots. */
export const provideAppContext = () => provideAppInitializer(() => void inject(AppContext));

/** Query keys start with their scope, so one key never means different data in two contexts. */
export const organisationKey = (organisation: string, ...parts: readonly unknown[]) =>
  ['org', organisation, ...parts] as const;
