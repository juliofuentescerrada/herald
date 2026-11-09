import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationPath } from './app-context';

/** `/` resolves the person's organisations: none → creation, one → its workspace, several → the selector. */
export const resolveHome: CanActivateFn = async () => {
  const router = inject(Router);
  const context = inject(AppContext);
  const { organisations } = await firstValueFrom(inject(HeraldHostAdminService).getMe());
  if (organisations.length === 0) return router.parseUrl('/organisations/new');
  if (organisations.length > 1) return router.parseUrl('/organisations');
  const only = organisationPath(organisations[0].id);
  // Already its workspace: an in-app navigation, not a new document.
  if (organisations[0].id.toLowerCase() === context.organisation()) return router.parseUrl(only);
  context.enter(only);
  return false;
};

/** The workspace of the organisation in the address; another one is a new document, never this one's state. */
export const inOrganisation: CanActivateFn = (route, state) => {
  const context = inject(AppContext);
  if (route.paramMap.get('organisationId')?.toLowerCase() === context.organisation()) return true;
  context.enter(state.url);
  return false;
};
