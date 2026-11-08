import { Routes } from '@angular/router';
import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Development-only routes that exercise the render modes without domain data (W-05). Production
 * replaces this file with fixtures.production.ts, so neither the routes nor their pages ship.
 */
export const fixtureRoutes: Routes = [
  { path: '_fixtures/ssr', title: 'SSR fixture · Herald', loadComponent: () => import('./fixture-pages').then((m) => m.ServerFixturePage) },
  { path: '_fixtures/client', title: 'Client fixture · Herald', loadComponent: () => import('./fixture-pages').then((m) => m.ClientFixturePage) },
];

export const fixtureServerRoutes: ServerRoute[] = [
  { path: '_fixtures/ssr', renderMode: RenderMode.Server },
  { path: '_fixtures/client', renderMode: RenderMode.Client },
];
