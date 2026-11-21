import { RenderMode, ServerRoute } from '@angular/ssr';
import { fixtureServerRoutes } from './fixtures';

/** W-05: corporate pages are prerendered; anything unknown is rendered per request with status 404. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  // Dynamic public entry pages are rendered per request (ADR 0011); visibility is read on every request (h1-public-read D-3).
  { path: 'tournaments/:tournamentId', renderMode: RenderMode.Server },
  ...fixtureServerRoutes,
  { path: '**', renderMode: RenderMode.Server },
];
