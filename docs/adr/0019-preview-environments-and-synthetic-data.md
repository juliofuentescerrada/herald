# 0019. Preview environments in fixed slots, with synthetic data seeded through the API

- Status: Proposed
- Date: 2026-11-12

## Context

ADR 0018 delivers H1's remaining slices onwards in batches that the maintainer tests, locally until M4 and then on a preview per pull request, and M4 (ADR 0012) deploys Herald onto the shared Azure platform after H1. Nothing runs in production yet; every deployed environment is a preview in practice. These choices are hard to reverse once M4's pipeline and infrastructure exist, so they are taken before M4.

Forces:

- **Identity.** Herald signs people in through the External ID directory shared with Arcana (ADR 0014). The admin application is a single-page application, whose redirect URIs are registered one by one, without wildcards. A deployment pipeline allowed to add redirect URIs would need write rights on `herald-admin` in a directory shared with another project. The fake identity provider of the end-to-end suite (ADR 0015) would let anyone sign in as anyone on a public address, which is why the host refuses its `E2E` environment in a deployment.
- **Work in progress.** ADR 0018 allows two slices in progress but tests and merges them one at a time, so one preview slot serves them in turn; the batch's proposals pull request changes no running code.
- **Messaging.** Modules of the host exchange integration events through durable local queues (ADR 0016); Service Bus is needed only when a party leaves the process (H4, H5). The host already runs without a broker in its `E2E` environment.
- **Data.** Testing a slice needs a populated application: organisations, tournaments in each state, entries, rosters. Today the maintainer creates them by hand on every local run. The application's rules live in its endpoints and aggregates, and the cross-module steps travel through the outbox (ADR 0008), so data written around them would be inconsistent.
- **Cost.** ADR 0012 already accepts the fixed cost of the shared PostgreSQL server and the Container Apps environment. Previews must not add a fixed cost of their own.

## Decision

### Environments

| Environment | Runs | Data | Lifetime |
|---|---|---|---|
| `main` | The latest commit of `main`, deployed on merge | Seeded when created, then kept across deployments; reset only by a manual workflow | Permanent |
| `preview` | The head of the slice pull request that holds the slot | Recreated and seeded on every deployment | Permanent slot, reassigned between pull requests |

When production arrives it is a third environment, and `main` becomes its staging.

- **Fixed slots, not one environment per pull request.** Each slot has stable addresses whose redirect URIs are registered once in `herald-admin`. A GitHub Actions concurrency group per slot keeps one deployment at a time; the pull request that holds `preview` releases it when it closes. A second preview slot is added only if two slices ever need testing at once.
- **Real identity, test personas.** Previews sign in through the shared directory. Test accounts per persona live in that directory and are assigned to Herald's applications (D-21): two owners of different organisations (isolation), and from H2 a player, a captain and a referee. Their passwords stay in the maintainer's password manager, never in the repository, the pipeline or a pull request. Their object identifiers are configuration of each environment. The agent never uses these accounts: it verifies through the end-to-end suite and its fake provider in CI.
- **Resources per slot**, on the shared platform: Container Apps for the host, the public SSR runtime and the admin application, with a minimum of zero replicas; one database per slot (`herald_main`, `herald_preview`) on the shared PostgreSQL server; no Service Bus. Running without a broker becomes a configuration option of the host instead of a property of `E2E`, until a party outside the process needs the broker.
- **Pipeline.** GitHub Actions with OIDC federation and OpenTofu (ADR 0012) builds the images, deploys the slot, recreates the database (for `preview`), applies the migrations and `db-apply`, seeds, and comments on the pull request with the addresses, the personas to use and the test script.

### Synthetic data

- **Through the application, in process.** A seeding tool starts Herald's host in its own process against the target database, the way the API tests already do (`HostFactory`), and calls the real endpoints over an in-memory connection with tokens it signs itself for the persona identities (as `TestTokens` does). Every write passes through the endpoints, the aggregates' invariants, durable history (ADR 0007) and the outbox; the tool waits until the outbox has drained before it exits. The seeding authentication exists only inside the tool's process and is never reachable over the network. The tool is not part of the host's deployed image.
- **Personas are the real accounts.** Seeded organisations belong to the personas' directory and object identifiers, so the maintainer signing in as a persona finds its seeded organisation. Locally and in CI the identifiers are fixed test values.
- **Scenarios follow the acceptance fixtures.** Seeds are named scenarios that mirror the discovery's acceptance fixtures (§18.1) and the states of the slices delivered so far: an empty organisation for first access; one tournament per state (draft, published with registration closed, open with a waiting queue, a team tournament with incomplete and complete rosters); a second organisation with its own data for isolation. Each slice that adds a state adds its scenario.
- **Deterministic and invented.** Fixed invented names, game-agnostic, never real people and no Wizards of the Coast content; dates relative to the time of seeding, so an open registration is still open. No data-generation library.
- **Never in production.** The tool refuses to run against an environment marked as production.
- **Locally too.** Aspire runs the seed once after the host is ready, so a local run starts populated.

### Cost

Previews add almost nothing to the base cost of the infrastructure, which the shared platform already carries (PostgreSQL server, Container Apps environment, registry, Log Analytics). The additions are small and mostly variable:

| Item | Why it stays small |
|---|---|
| Container Apps | Minimum zero replicas: cost only while someone uses the slot, largely inside the consumption plan's monthly free grant |
| Databases | Two databases on the shared server: storage only, no extra compute |
| Registry | Images of the slots; a retention policy removes old tags |
| Log Analytics | Ingestion from two lightly used environments, with sampling |
| Service Bus | None until H4 or H5 |

M4 records the measured monthly cost of `main` and `preview` beside the base cost, and alerts on the platform budget. A minimum replica count above zero, an always-on SSR runtime or a database server per slot would each break this estimate and need a decision.

## Alternatives considered

- **One environment per pull request**: needs a redirect URI per pull request, so either write rights on the shared directory's application registration in the pipeline or a fake provider exposed publicly; and ADR 0018 tests one slice at a time, so a second slot would sit idle.
- **The fake identity provider in previews**: anyone could sign in as anyone on a public address.
- **A separate test directory**: isolates test accounts but adds a second External ID tenant and its configuration; the maintainer accepted the shared directory.
- **Revisions of one container app with labels**: cheaper to wire, but slots would share configuration and the database.
- **SQL dumps or scripts**: break with each migration and skip the aggregates' rules and the outbox.
- **Seeding through the deployed API**: needs real user tokens from a script, which External ID does not offer for these accounts.
- **Writing through the aggregates and DbContexts directly**: repeats the endpoints' orchestration and bypasses the integration events between modules.

## Consequences

- Positive: the maintainer tests on a deployed, populated application with real sign-in; data are consistent with the rules because they are made by them; local runs start populated.
- Positive: no fixed cost beyond the shared platform's.
- Negative: one `preview` slot serialises testing; a second slot is a configuration change plus a registered redirect URI.
- Negative: persona accounts in a directory shared with Arcana must be kept assigned to Herald only.
- Negative: seeds must follow every change of the endpoints they call; a stale scenario fails the seeding step, which CI runs.
- Follow-ups: the change that adds the seeding tool and its first scenarios (`dev-synthetic-data`, during H1); the broker as a configuration option, slots, pipeline, personas and cost measurement in M4; a second slot if two slices ever need testing at once.

Direction agreed with the maintainer on 12 November 2026 (`main` keeps its data with a manual reset; test personas in the shared directory; cost noted); the details remain Proposed.
