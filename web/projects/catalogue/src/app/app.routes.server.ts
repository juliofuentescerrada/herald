import { RenderMode, ServerRoute } from '@angular/ssr';

/** Every catalogue page is prerendered, which renders each control on the server (W-03). */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
