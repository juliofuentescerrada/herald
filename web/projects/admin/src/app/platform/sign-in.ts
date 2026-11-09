import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AccessState } from './access';
import { Session } from './session';

/** Every admin route needs a signed-in person; otherwise sign in and come back to the requested address. */
export const signedIn: CanActivateChildFn = async (_route, state) => {
  const session = inject(Session);
  const access = inject(AccessState);
  if (session.account()) return true;
  // A failed return shows its state instead of sending the person straight back to the directory.
  const failure = session.failure();
  if (failure) {
    access.report(failure);
    return false;
  }
  access.report('signing-in');
  await session.signIn(state.url);
  return false;
};

/** Tokens go to Herald's own API only, never to another origin or path. */
export const apiToken: HttpInterceptorFn = (request, next) => {
  if (!/^\/api(\/|$)/.test(request.url)) return next(request);
  const access = inject(AccessState);
  return from(inject(Session).token()).pipe(
    // No token without interaction: the session expired (or was revoked) while the person worked.
    catchError((error: unknown) => {
      access.report('session-expired');
      return throwError(() => error);
    }),
    switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
  );
};
