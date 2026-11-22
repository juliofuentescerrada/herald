import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Dialogs } from '@herald/ui';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { operationIdentity } from '@herald/api-client/admin';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { routes } from './app.routes';
import { accessErrors, apiToken, AUTH_CONFIG, AuthConfig, CONFIRM, Confirmation, provideAppContext, QUERY_CLIENT } from './platform';

export const appConfig = (auth: AuthConfig): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AUTH_CONFIG, useValue: auth },
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiToken, operationIdentity, accessErrors])),
    provideTanStackQuery(QUERY_CLIENT),
    provideAppContext(),
    {
      provide: CONFIRM,
      useFactory: () => {
        const dialogs = inject(Dialogs);
        return (question: Confirmation) => dialogs.confirm(question);
      },
    },
  ],
});
