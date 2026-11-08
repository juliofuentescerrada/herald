import { RenderMode, ServerRoute } from '@angular/ssr';
import { fixtureServerRoutes } from './fixtures';

/** W-05: corporate pages are prerendered; anything unknown is rendered per request with status 404. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  ...fixtureServerRoutes,
  { path: '**', renderMode: RenderMode.Server },
];
