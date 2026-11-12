import { execFileSync } from 'node:child_process';
import { databaseConnectionString, scriptPersona, tenantId } from '../environment.ts';

// Seeds the synthetic scenarios (ADR 0019) once the host is up, for the persona the scripts sign in as.
export default function seed(): void {
  execFileSync('dotnet', ['run', '--project', '../tools/Herald.Seed'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ConnectionStrings__herald: databaseConnectionString,
      Herald__Seed__Personas__Main__DirectoryId: tenantId,
      Herald__Seed__Personas__Main__ObjectId: scriptPersona.oid,
      Herald__Seed__Personas__Main__Name: scriptPersona.name,
    },
  });
}
