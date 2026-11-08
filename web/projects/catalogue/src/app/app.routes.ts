import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Herald catalogue', loadComponent: () => import('./controls-page').then((m) => m.ControlsPage) },
];
