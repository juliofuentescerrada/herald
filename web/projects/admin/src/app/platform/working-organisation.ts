import { inject } from '@angular/core';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationKey } from './app-context';

/** The working organisation's summary, for the rail and page headings; nothing without an organisation. */
export const injectWorkingOrganisation = () => {
  const context = inject(AppContext);
  const api = inject(HeraldHostAdminService);
  return injectQuery(() => {
    const id = context.organisation();
    return {
      queryKey: organisationKey(id ?? 'none', 'summary'),
      queryFn: () => firstValueFrom(api.getOrganisation(id!)),
      enabled: id !== null,
      staleTime: Infinity,
    };
  });
};
