## Status

**Approved for implementation on 9 November 2026** (the maintainer asked to apply it). Stacked locally on `h1-organisation-access`, whose journeys it tests; its pull request follows that change's. No screens are created or modified, so mockups are not applicable (`design.md`). Implementation depends on `h1-organisation-access` being merged: its journeys are what these tests exercise.

## Why

Herald's critical paths now cross every layer: the admin application signs in through MSAL, the host validates directory tokens, the membership step and the persistence filter decide what an organisation's operator sees, and the public application links into the admin one. Each layer has its own tests, but nothing proves they work together: `h1-organisation-access` found an authority that would have failed against the real directory only by reading another project's guide. ADR 0010 already plans "Playwright for a few complete journeys"; the access slice is the first moment they have something to run.

## What Changes

- A system-level end-to-end suite in a new root folder `e2e/`: Playwright with TypeScript, its own `package.json`, Chromium only, accessibility checks on every visited page.
- A fake OpenID Connect provider for the suite, so the real MSAL code in the admin application and the real JWT bearer validation in the host run unchanged: `navikt/mock-oauth2-server` in a container, with the suite's personas (assigned, unassigned, short-lived session) as configuration. The first task proves MSAL works against it; if it does not, the fallback is a minimal provider written for the suite.
- The suite starts its own system: PostgreSQL and the provider in containers, the host in a new `E2E` environment, the admin application and the public server rendering.
- A host environment `E2E` that runs without Azure Service Bus (external Wolverine transports off, as the host tests already do) and accepts the fake provider through the ordinary sign-in configuration. It is refused outside a local or CI run.
- Nine journeys: public Sign in, deep-link sign-in returning to the requested address, a newcomer creating an organisation, selecting and switching organisations with the other tab reloading, the generic denial for another owner's organisation, an unassigned person, an expired session keeping typed input, the leave confirmation, and sign-out reloading other tabs.
- A CI job that runs the suite on every pull request.
- A new ADR recording the fake provider and the suite's place in the repository.

Out of scope: tests against the real directory (sign-in there uses e-mail one-time passcodes and stays a manual check), other browsers, visual comparison with the mockups, load or performance testing, and journeys of features that do not exist yet.

## Capabilities

### New Capabilities

- `end-to-end-journeys`: the system-level suite, the journeys it must cover, the fake identity provider and how the suite starts and isolates the system it tests.

### Modified Capabilities

- `continuous-integration`: pull requests also run the end-to-end suite.

## Impact

- New folder `e2e/` with its own dependencies: `@playwright/test` (Apache-2.0), `@axe-core/playwright` (MPL-2.0, as `axe-core` already used by the web tests), `testcontainers` (MIT); exact versions checked before adding. Container image `ghcr.io/navikt/mock-oauth2-server` (MIT).
- Host: an `E2E` environment and the switch that leaves Azure Service Bus out of it. No production behaviour changes.
- Admin application: its runtime configuration may name the provider's protocol mode and known authority when the provider is not Microsoft's; the default stays the directory.
- CI: a new job with Docker, .NET, Node and Chromium; longer pull-request checks.
- Local runs need Docker with room for PostgreSQL and the provider next to the other containers.
