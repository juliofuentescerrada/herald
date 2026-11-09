import { Routes } from '@angular/router';
import { signedIn } from './platform';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [signedIn],
    children: [
      { path: '', title: 'Overview · Herald', loadComponent: () => import('./overview-page').then((m) => m.OverviewPage) },
      { path: '**', title: 'Page not found · Herald', loadComponent: () => import('./not-found-page').then((m) => m.NotFoundPage) },
    ],
  },
];
