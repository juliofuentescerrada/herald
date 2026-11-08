import { defineConfig } from 'orval';

// One target per OpenAPI document (W-04): an Angular service on HttpClient plus plain model interfaces.
// Query plugins stay off: features wrap the calls in TanStack Query by hand.
const target = (document: string, output: string) => ({
  input: { target: `./projects/api-client/openapi/${document}.json` },
  output: {
    target: `./projects/api-client/src/${output}/generated/api.ts`,
    client: 'angular' as const,
    mode: 'single' as const,
    clean: true,
  },
});

export default defineConfig({
  public: target('herald.public', 'public'),
  admin: target('herald.admin', 'admin'),
  fixturesPublic: target('fixtures/herald.fixtures.public', 'fixtures/public'),
  fixturesAdmin: target('fixtures/herald.fixtures.admin', 'fixtures/admin'),
});
