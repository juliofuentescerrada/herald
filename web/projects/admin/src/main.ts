import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

type AuthConfig = Parameters<typeof appConfig>[0];

/** Served next to the app: written from HERALD_AUTH_* by `start:admin` in development, by hosting elsewhere (M4). */
const loadAuthConfig = async (): Promise<AuthConfig> => {
  const response = await fetch('/runtime-config.json', { cache: 'no-store' });
  const config = response.ok ? ((await response.json()) as Partial<AuthConfig>) : {};
  if (!config.authority || !config.clientId || !config.apiScope)
    throw new Error('runtime-config.json lacks authority, clientId or apiScope: see docs/operations/identity.md.');
  return config as AuthConfig;
};

loadAuthConfig()
  .then((auth) => bootstrapApplication(App, appConfig(auth)))
  .catch((err) => {
    console.error(err);
    document.body.textContent = 'Herald cannot start: its sign-in configuration is missing.';
  });
