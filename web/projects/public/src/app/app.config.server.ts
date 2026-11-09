import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideOrganiserWorkspaceUrl, provideServerApi } from './platform';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideServerApi(process.env['HERALD_API_URL']),
    provideOrganiserWorkspaceUrl(process.env['HERALD_ADMIN_URL']),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
