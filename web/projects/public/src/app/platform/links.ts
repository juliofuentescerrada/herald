import { InjectionToken, inject, makeStateKey, Provider, TransferState } from '@angular/core';

const workspaceKey = makeStateKey<string>('herald-organiser-workspace-url');

/**
 * Where the public app sends organisers to sign in: the admin application (D-10). The server reads it
 * from HERALD_ADMIN_URL and hands it to the browser through the transfer state, so hydration keeps the
 * same address. shortcut: without it, a path on the same host; hosting supplies the real address (M4).
 */
export const ORGANISER_WORKSPACE_URL = new InjectionToken<string>('Herald organiser workspace URL', {
  factory: () => inject(TransferState).get(workspaceKey, '/admin/'),
});

/** Server-only: the admin application's address for this deployment. */
export const provideOrganiserWorkspaceUrl = (url: string | undefined): Provider[] =>
  url
    ? [
        {
          provide: ORGANISER_WORKSPACE_URL,
          useFactory: () => {
            inject(TransferState).set(workspaceKey, url);
            return url;
          },
        },
      ]
    : [];
