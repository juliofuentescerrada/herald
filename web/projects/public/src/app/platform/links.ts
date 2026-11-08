import { InjectionToken } from '@angular/core';

/** Where the public app sends organisers. shortcut: a path on the same host; Aspire (task 4.4) and hosting (ADR 0012) supply the real address. */
export const ORGANISER_WORKSPACE_URL = new InjectionToken<string>('Herald organiser workspace URL', {
  factory: () => '/admin/',
});
