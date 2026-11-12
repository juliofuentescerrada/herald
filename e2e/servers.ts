// The servers every Playwright run needs, shared by the journeys and the test scripts (harness-engineering D-14).
import type { PlaywrightTestConfig } from '@playwright/test';
import {
  adminClientId,
  apiScope,
  audience,
  authority,
  databaseConnectionString,
  ports,
  urls,
} from './environment.ts';

const ci = !!process.env['CI'];
const startUp = 180_000;

// webServers start in this order, all before globalSetup: the infrastructure comes first.
export const webServer: PlaywrightTestConfig['webServer'] = [
  {
    name: 'infrastructure',
    command: 'node infrastructure.ts',
    wait: { stdout: /infrastructure is ready/ },
    gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    timeout: startUp,
  },
  {
    name: 'host',
    command: 'dotnet run --project ../src/Herald.Host --no-launch-profile',
    url: `${urls.host}/health`,
    env: {
      ASPNETCORE_ENVIRONMENT: 'E2E',
      ASPNETCORE_URLS: urls.host,
      ConnectionStrings__herald: databaseConnectionString,
      Herald__Authentication__Authority: authority,
      Herald__Authentication__Audience: audience,
    },
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
    reuseExistingServer: !ci,
    timeout: startUp,
  },
  {
    name: 'admin',
    command: 'npm run start:admin',
    cwd: '../web',
    url: urls.admin,
    env: {
      PORT: String(ports.admin),
      HERALD_API_URL: urls.host,
      HERALD_PUBLIC_URL: urls.public,
      HERALD_AUTH_AUTHORITY: authority,
      HERALD_AUTH_CLIENT_ID: adminClientId,
      HERALD_AUTH_API_SCOPE: apiScope,
      HERALD_AUTH_PROTOCOL_MODE: 'OIDC',
      HERALD_AUTH_KNOWN_AUTHORITIES: `localhost:${ports.provider}`,
    },
    reuseExistingServer: !ci,
    timeout: startUp,
  },
  {
    name: 'public',
    command: 'npm run start:public',
    cwd: '../web',
    url: urls.public,
    env: { PORT: String(ports.public), HERALD_API_URL: urls.host, HERALD_ADMIN_URL: urls.admin },
    reuseExistingServer: !ci,
    timeout: startUp,
  },
];
