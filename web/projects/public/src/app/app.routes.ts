import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Herald · Tournaments for every game', loadComponent: () => import('./home-page').then((m) => m.HomePage) },
];
