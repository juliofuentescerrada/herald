import { inject } from '@angular/core';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { Session } from './session';

/** The signed-in person and the organisations they own; a person change is a new document, so one key suffices. */
export const injectMe = () => {
  const api = inject(HeraldHostAdminService);
  const session = inject(Session);
  return injectQuery(() => ({
    queryKey: ['me'],
    queryFn: () => firstValueFrom(api.getMe()),
    // Before sign-in there is no token: asking would look like an expired session.
    enabled: session.account() !== null,
    staleTime: 60_000,
  }));
};
