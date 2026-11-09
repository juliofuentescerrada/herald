// The suite's first webServer: Playwright starts webServers before globalSetup, and the host needs these first.
// Playwright stops it with SIGTERM at the end; testcontainers' reaper removes the containers if it dies instead.
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { databasePassword, ports, tenantId } from './environment.ts';

const provider = new GenericContainer(
  'ghcr.io/navikt/mock-oauth2-server@sha256:647dd8c78a54f0e6fcd58d79c884e612f8f998a0662276f3e1db22e464a50192',
)
  .withExposedPorts({ container: 8080, host: ports.provider })
  .withEnvironment({
    // TLS because MSAL refuses an authority that is not https; the login form carries each persona's claims.
    JSON_CONFIG: JSON.stringify({ interactiveLogin: true, httpServer: { type: 'NettyWrapper', ssl: {} } }),
    JAVA_TOOL_OPTIONS: '-Xmx256m',
  })
  .withWaitStrategy(Wait.forHttp(`/${tenantId}/.well-known/openid-configuration`, 8080).usingTls().allowInsecure());

const database = new GenericContainer('postgres:18.3')
  .withExposedPorts({ container: 5432, host: ports.database })
  .withEnvironment({ POSTGRES_PASSWORD: databasePassword, POSTGRES_DB: 'herald' })
  .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2));

const started: StartedTestContainer[] = await Promise.all([provider.start(), database.start()]);
console.log('Herald end-to-end infrastructure is ready');

const stop = async () => {
  await Promise.allSettled(started.map((container) => container.stop()));
  process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
// Nothing else keeps Node running: without this it exits and the reaper removes the containers mid-run.
setInterval(() => {}, 60_000);
