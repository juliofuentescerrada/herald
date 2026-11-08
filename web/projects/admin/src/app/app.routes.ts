import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Overview · Herald', loadComponent: () => import('./overview-page').then((m) => m.OverviewPage) },
  { path: '**', title: 'Page not found · Herald', loadComponent: () => import('./not-found-page').then((m) => m.NotFoundPage) },
];
