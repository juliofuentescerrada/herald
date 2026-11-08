import { publicClient } from '@fixture/api-client/public';
import { adminClient } from '@fixture/api-client/admin'; // violation
import { contextLabel } from '../../../../../admin/src/app/platform'; // violation

export const delta = [publicClient, adminClient, contextLabel];
