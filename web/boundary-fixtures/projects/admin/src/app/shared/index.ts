import { button } from '@fixture/ui';
import { betaInternal } from '../features/beta'; // violation

export const label = button + betaInternal;
