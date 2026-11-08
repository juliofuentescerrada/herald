import { Routes } from '@angular/router';
import { fixtureRoutes } from './fixtures';

export const routes: Routes = [
  { path: '', title: 'Herald · Tournaments for every game', loadComponent: () => import('./home-page').then((m) => m.HomePage) },
  ...fixtureRoutes,
  { path: '**', title: 'Page not found · Herald', loadComponent: () => import('./not-found-page').then((m) => m.NotFoundPage) },
];
