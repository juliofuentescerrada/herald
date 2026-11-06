# 0011. An Angular front end, with the API contract generated from OpenAPI

- Status: Proposed
- Date: 2026-11-06

## Context

Herald needs screens for organisers (create a tournament, close registration, confirm results) and for players and spectators (register, report a result, follow the standings live). The maintainer works with Angular, and the front end should show a modern Angular codebase. Response types written by hand drift from the API.

## Decision

- **Angular** with standalone components and signals, organised by feature, with lazy routes; features don't import each other.
- **TanStack Query** for server state; signals for local state.
- **The API contract is generated:** building the host writes the OpenAPI document, and the TypeScript types and client are generated from it; both are committed, and CI fails if they are stale.
- **Live standings** through a push channel (SignalR or server-sent events), decided in the change that adds it.
- Unit tests with Vitest and Testing Library (ADR 0010).

## Alternatives considered

- **React or Blazor:** both capable; Angular is what the maintainer would lead in a team, so that is what the reference shows.
- **Hand-written API types:** less tooling, guaranteed drift.
- **NgRx for all state:** a lot of structure for state that is mostly server state, which TanStack Query already caches.

## Consequences

- Positive: a front end and back end that can't silently disagree; a codebase organised the way the back end is, by feature.
- Negative: code generation adds a build step and generated files to review.
- Follow-ups: the UI component approach (a library or components of our own) and the generator, in the first front-end change.
