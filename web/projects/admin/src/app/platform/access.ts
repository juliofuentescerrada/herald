import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { AuthError } from '@azure/msal-browser';
import { catchError, throwError } from 'rxjs';
import { QUERY_CLIENT } from './query-client';

/** The reviewed access states (D-9); each replaces the whole workspace, so no private data stays on screen. */
export type AccessProblem =
  | 'signing-in'
  | 'sign-in-failed'
  | 'sign-in-cancelled'
  | 'not-assigned'
  | 'session-expired'
  | 'unavailable'
  | 'recovery';

/** What the directory said when a sign-in did not complete. */
export const signInProblem = (error: unknown): AccessProblem => {
  const text = error instanceof AuthError ? `${error.errorCode} ${error.errorMessage}` : String(error);
  // AADSTS50105: the person is not assigned to Herald's application (assignment required, D-1).
  if (text.includes('AADSTS50105')) return 'not-assigned';
  if (error instanceof AuthError && ['user_cancelled', 'access_denied'].includes(error.errorCode)) return 'sign-in-cancelled';
  return 'sign-in-failed';
};

@Injectable({ providedIn: 'root' })
export class AccessState {
  private readonly queries = inject(QUERY_CLIENT);
  private readonly drafts = new Set<() => string>();
  private readonly current = signal<AccessProblem | null>(null);
  private readonly kept = signal('');

  readonly problem = this.current.asReadonly();
  /** Only what this person typed, captured when access stopped; never stored, never resubmitted (A-3). */
  readonly unsavedInput = this.kept.asReadonly();

  /** Hides the workspace and drops loaded private data; the person's own unsaved input is kept for copying. */
  report(problem: AccessProblem): void {
    if (this.current() === null) {
      this.kept.set([...this.drafts].map((read) => read().trim()).filter(Boolean).join('\n\n'));
      this.queries.clear();
    }
    this.current.set(problem);
  }

  /** A form registers its unsaved input while it lives; call in an injection context. */
  keepDraft(read: () => string): void {
    this.drafts.add(read);
    inject(DestroyRef).onDestroy(() => this.drafts.delete(read));
  }
}

/** Herald API answers that mean access stopped: the workspace gives way to the matching access state. */
export const accessErrors: HttpInterceptorFn = (request, next) => {
  const access = inject(AccessState);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && /^\/api(\/|$)/.test(request.url)) {
        if (error.status === 401) access.report('session-expired');
        else if (error.status === 403) access.report('not-assigned');
        // The same answer for a missing organisation and one the person cannot use: never say which.
        else if (error.status === 404 && error.error?.type === 'organisation-not-available') access.report('unavailable');
      }
      return throwError(() => error);
    }),
  );
};
