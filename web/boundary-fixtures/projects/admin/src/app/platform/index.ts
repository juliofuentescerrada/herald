import { adminClient } from '@fixture/api-client/admin';
import { alphaRoutes } from '../features/alpha'; // violation

export const contextLabel = adminClient + alphaRoutes.length;
