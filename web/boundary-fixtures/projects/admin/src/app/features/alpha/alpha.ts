import { helper } from './helper';
import { contextLabel } from '../../platform';
import { button } from '@fixture/ui';
import { button as internalButton } from '../../../../../ui/src/lib/button'; // violation
import { betaInternal } from '../beta'; // violation
import { betaInternal as aliased } from '@fixture/beta'; // violation
import { routes } from '../../app.routes'; // violation
import { primitive } from 'ng-primitives/button'; // violation
import { IconHome } from '@tabler/icons-angular'; // violation

export const alphaRoutes = [helper, contextLabel, button, internalButton, betaInternal, aliased, routes, primitive, IconHome];
export const lazyBeta = () => import('../beta'); // violation
