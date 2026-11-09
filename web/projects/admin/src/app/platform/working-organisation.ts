import { inject } from '@angular/core';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationKey } from './app-context';
import { Session } from './session';

/** The working organisation's summary, for the rail and page headings; nothing without an organisation. */
export const injectWorkingOrganisation = () => {
  const context = inject(AppContext);
  const api = inject(HeraldHostAdminService);
  const session = inject(Session);
  return injectQuery(() => {
    const id = context.organisation();
    return {
      queryKey: organisationKey(id ?? 'none', 'summary'),
      queryFn: () => firstValueFrom(api.getOrganisation(id!)),
      // Before sign-in there is no token: asking would look like an expired session.
      enabled: id !== null && session.account() !== null,
      staleTime: Infinity,
    };
  });
};
