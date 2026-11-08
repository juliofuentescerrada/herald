import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { routes } from './app.routes';
import { provideAppContext, QUERY_CLIENT } from './platform';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideTanStackQuery(QUERY_CLIENT),
    provideAppContext(),
  ],
};
