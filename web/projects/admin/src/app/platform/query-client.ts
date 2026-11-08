import { InjectionToken } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';

/**
 * One QueryClient per root injector: per document in the browser, per request on the server.
 * Never `new QueryClient()` at module level: every server request would share it (W-06).
 */
export const QUERY_CLIENT = new InjectionToken<QueryClient>('Herald QueryClient', {
  factory: () => new QueryClient(),
});
