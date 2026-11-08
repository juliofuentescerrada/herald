import { contextLabel } from './platform';
import { label } from './shared';
import { button } from '@fixture/ui';
import { adminClient } from '@fixture/api-client/admin';
import { betaInternal } from './features/beta/beta'; // violation

export const routes = [
  { path: 'alpha', loadChildren: () => import('./features/alpha').then((m) => m.alphaRoutes) },
  { path: 'beta', data: { contextLabel, label, button, adminClient, betaInternal } },
];
