## Status

**Approved for implementation on 12 November 2026** (gate 1.1). Direction agreed the same day in ADR 0019 (Proposed); the maintainer answered the design's questions (`design.md`) and chose to implement it in a pull request of its own, after the documentation's.

## Why

Every local run of Herald starts empty, so the maintainer recreates organisations, tournaments, guests, entries and rosters by hand before testing anything. From H2, ADR 0018 has the maintainer test each slice on a deployed preview, which also needs populated data, and ADR 0019 decides that this data is synthetic and made by the application's own rules. A seeding tool built now serves the remaining H1 slices locally and is ready for M4's environments.

## What Changes

- **Seeding tool** (`tools/Herald.Seed`): starts Herald's host in its own process against a target database, signs its own tokens for persona identities, and calls the real admin endpoints over an in-memory connection. It waits until the outbox has drained before exiting. It is not part of the host's deployed image, and its authentication never leaves its process.
- **Scenarios:** named, deterministic scenarios matching the states delivered in H1 so far: an empty organisation; tournaments in draft, published with registration not open, open with a waiting queue, and closed; a team tournament with incomplete and complete rosters; a second organisation with its own data for isolation. Names are invented and game-agnostic; dates are relative to the time of seeding.
- **Personas:** each scenario belongs to a persona identified by a directory identifier and object identifier taken from configuration. Locally the main persona can be the maintainer's own account, so signing in shows the seeded organisation.
- **Safety:** the tool refuses an environment marked as production, and skips a scenario whose organisation already exists, so a kept database is not seeded twice.
- **Aspire:** the AppHost runs the tool once after the host is ready, when the persona identifiers are configured.
- **Shared test support:** the in-process host and token signing that the API tests use (`HostFactory`, `TestTokens`) move to a small shared project used by the tests and the tool, instead of being copied.
- **CI:** the seeding runs against a throwaway database in CI, so a scenario broken by a change of an endpoint fails the build.
- Documents: `CLAUDE.md` and the local identity guide gain the seeding command and its configuration.

Out of scope: the `main` and `preview` slots, the deployment pipeline, persona accounts in the directory and the broker as a configuration option (M4, ADR 0019); scenarios for states that do not exist yet (each later slice adds its own); public pages.

Screens: none created or modified; mockups are not applicable.

Notifiable facts: none introduced. Seeding produces the facts the existing endpoints already record (ADR 0017's inventory is unchanged).

Decision register: D-21 (identity keyed by directory and object identifiers, confirmed) and D-22 (organisation-scoped guests, confirmed) shape the personas and guests; no undecided rule is needed.

## Capabilities

### New Capabilities

- `synthetic-data`: the seeding tool, its scenarios, personas and safety rules, and its run in CI.

### Modified Capabilities

- `local-environment`: one command starts the system locally and seeds it once when the persona identifiers are configured.

## Impact

- New projects: `tools/Herald.Seed` and the shared test-support project; `Herald.slnx` gains both.
- `tests/Herald.Host.Tests` uses the shared test support instead of its own `HostFactory` and `TestTokens`.
- `src/Herald.AppHost`: an optional seeding resource and two optional parameters.
- `.github/workflows/ci.yml` and `scripts/check`: a seeding step against the test database.
- No change to the host's endpoints, modules, migrations, integration contracts or the web applications.
