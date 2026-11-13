import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, signal } from '@angular/core';
import { Button, Icon, Notice } from '@herald/ui';
import { AccessProblem, AccessState, AppContext, AUTH_CONFIG, Session } from './platform';

interface Copy {
  readonly heading: string;
  readonly lead: string;
  readonly side: readonly [string, string];
}

const accountSide: Copy['side'] = [
  'Your account and your organisation',
  'Your account provider handles sign-in. Herald checks your organisation membership before showing private content.',
];

const copy: Record<AccessProblem, Copy> = {
  'signing-in': {
    heading: 'Taking you to sign in',
    lead: 'Continue with your account provider. You will return to Herald afterwards.',
    side: ['Access by invitation', 'Only people invited by the platform operator and assigned to Herald can sign in. If you need access, contact the platform operator.'],
  },
  'sign-in-failed': { heading: 'Sign-in did not complete', lead: 'You are not signed in to Herald. Try again with your invited account.', side: accountSide },
  'sign-in-cancelled': { heading: 'Sign-in was cancelled', lead: 'You are not signed in to Herald. Try again with your invited account.', side: accountSide },
  'not-assigned': {
    heading: 'Herald access is by invitation',
    lead: 'Your account has not been granted access to Herald.',
    side: ['Need an invitation?', 'Ask the platform operator responsible for your Herald access. There is no self-service registration.'],
  },
  'session-expired': { heading: 'Sign in again to continue', lead: 'Your session expired. Private content has been hidden.', side: accountSide },
  unavailable: {
    heading: 'This page is unavailable',
    lead: 'Check that you are signed in to the expected account.',
    side: ['Access stays private', 'This response does not confirm whether the requested page exists.'],
  },
  recovery: {
    heading: 'Recover access to your account',
    lead: 'Start with your account provider’s self-service recovery. Herald cannot reset your password.',
    side: ['A recorded recovery procedure', 'Access can be relinked only after verified ownership. Support does not grant access simply because someone knows a name or email address.'],
  },
};

/** Replaces the whole workspace while access needs attention (D-9); which state applies is platform's AccessState. */
@Component({
  selector: 'app-access-page',
  imports: [Button, Icon, Notice],
  templateUrl: './access-page.html',
  styleUrl: './access-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessPage {
  protected readonly access = inject(AccessState);
  private readonly session = inject(Session);
  private readonly context = inject(AppContext);
  private readonly document = inject(DOCUMENT);
  protected readonly publicUrl = inject(AUTH_CONFIG).publicUrl;
  protected readonly copy = computed(() => copy[this.access.problem() ?? 'unavailable']);
  protected readonly signedIn = computed(() => this.session.account() !== null);
  protected readonly copyStatus = signal('');

  /** Back to the address the person was on, after the directory. */
  protected signIn(anotherAccount = false): void {
    const { pathname, search, hash } = this.document.location;
    this.access.report('signing-in');
    void this.session.signIn(`${pathname}${search}${hash}`, anotherAccount);
  }

  protected chooseOrganisation(): void {
    this.context.replace('/');
  }

  protected signOut(): void {
    void this.context.signOut();
  }

  protected recovery(): void {
    this.access.report('recovery');
  }

  protected async copyInput(): Promise<void> {
    try {
      await this.document.defaultView!.navigator.clipboard.writeText(this.access.unsavedInput());
      this.copyStatus.set('Your unsaved input was copied.');
    } catch {
      this.copyStatus.set('Copying is not available here. Select the text and copy it yourself.');
    }
  }
}
