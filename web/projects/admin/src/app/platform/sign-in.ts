import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { from, switchMap } from 'rxjs';
import { Session } from './session';

/** Every admin route needs a signed-in person; otherwise sign in and come back to the requested address. */
export const signedIn: CanActivateChildFn = async (_route, state) => {
  const session = inject(Session);
  if (session.account()) return true;
  await session.signIn(state.url);
  return false;
};

/** Tokens go to Herald's own API only, never to another origin or path. */
export const apiToken: HttpInterceptorFn = (request, next) => {
  if (!/^\/api(\/|$)/.test(request.url)) return next(request);
  return from(inject(Session).token()).pipe(
    switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
  );
};
