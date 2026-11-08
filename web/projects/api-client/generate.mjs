// Regenerates the OpenAPI documents and their clients (m0-web-shell 5.2, W-04): exports each document
// from the host that owns it with Wolverine's `openapi` command, which builds the host without starting
// it (no database, broker or credentials), then runs orval with orval.config.ts.
// Usage (from web/): pnpm api:generate
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const repository = resolve(import.meta.dirname, '../../..');
const openapi = resolve(import.meta.dirname, 'openapi');
const hosts = [
  { project: 'src/Herald.Host', prefix: 'herald' },
  { project: 'tests/Herald.ApiFixtures', prefix: 'fixtures/herald.fixtures' },
];
const run = (command, args) => execFileSync(command, args, { cwd: repository, stdio: 'inherit' });

for (const { project, prefix } of hosts) {
  run('dotnet', ['build', project, '--verbosity', 'quiet', '--nologo']);
  for (const document of ['public', 'admin']) {
    run('dotnet', ['run', '--no-build', '--project', project, '--', 'openapi', '-d', document, '-o', `${openapi}/${prefix}.${document}.json`]);
  }
}
execFileSync('pnpm', ['exec', 'orval', '--config', 'orval.config.ts'], { cwd: resolve(repository, 'web'), stdio: 'inherit' });
