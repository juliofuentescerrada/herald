import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { routes } from './app.routes';
import { apiToken, AUTH_CONFIG, AuthConfig, provideAppContext, provideSession, QUERY_CLIENT } from './platform';

export const appConfig = (auth: AuthConfig): ApplicationConfig => ({
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AUTH_CONFIG, useValue: auth },
    provideSession(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiToken])),
    provideTanStackQuery(QUERY_CLIENT),
    provideAppContext(),
  ],
});
