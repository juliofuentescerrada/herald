# 0014. Sign in through the shared External ID directory; Herald authorises and isolates organisations

- Status: Accepted
- Date: 2026-11-09
- Revised: 2026-11-10 (accepted after the implementation was run against the real directory)

## Context

H1 needs sign-in and organisation isolation (ADR 0013, D-21): another organisation's operator must not read or mutate a tournament (AT-12). Herald has no identity yet. The maintainer already runs a Microsoft Entra External ID directory for Arcana. It is managed by hand (Arcana's ADR 0034), outside every repository's OpenTofu state, and Steward, the shared platform, keeps it as is. Herald's pilot users are a few people the maintainer invites. ADR 0012 left the provider to "the sign-in change".

Modules never reference each other (ADR 0004), yet every module's organisation-scoped endpoint has to know whether the caller belongs to that organisation, and revocation must take effect on the next request.

## Decision

- **Provider:** sign-in uses the External ID directory shared with Arcana, through two application registrations of Herald's own: the API (an exposed scope and an `Organiser` application role) and the admin SPA. Both require user assignment, so only people the platform operator assigns can obtain a token. There is no self-service registration. The registrations are created by hand and documented, like the directory; nothing is added to Arcana's or Steward's state.
- **Protocols:** the admin application signs in with authorisation code and PKCE through MSAL Angular and calls the API with bearer tokens. The host validates them with ASP.NET Core's JWT bearer handler: issuer, audience, lifetime and the `Organiser` role. The public application stays anonymous (W-06).
- **Identity:** a person is the pair of the token's `tid` and `oid`. Email and names are never identity. The provider authenticates; Herald's memberships authorise.
- **Membership resolution:** organisation-scoped routes carry `{organisationId}`. Before any handler, a host step asks an organisation-access port, defined in `Herald.ModuleHosting` and implemented by the Organisations module, whether the caller is a current member. Success sets a request-scoped organisation context; failure answers the same 404 as a missing organisation. Other modules see only the context, never the Organisations module.
- **Persistence isolation:** organisation-owned entities carry the organisation as an EF Core shadow property, outside the domain. A global query filter limits queries to the current organisation (none without a context), and the save stamps new rows and rejects rows of another organisation. Both come from a base `DbContext` in `Herald.ModuleHosting` (EF Core re-reads a filter's value per query only from a `DbContext` member), so every module applies them the same way.
- **Row-level security:** not adopted in H1. The bounded experiment in `h1-organisation-access` showed PostgreSQL RLS works with pooled connections and concurrency, but it needs a non-superuser application role (local PostgreSQL and test containers connect as superuser, which bypasses it), a person policy for cross-organisation reads such as `/api/me`, and per-handler context before Wolverine opens a connection. Revisit before the first real deployment (M4).

## Alternatives considered

- **A new directory for Herald:** cleaner separation, but more to administer for a pilot of invited people; the shared directory can be split later because Herald keys on its own person records.
- **Self-service sign-up user flows:** open registration contradicts the invited pilot and would need abuse controls H1 does not have.
- **Entra app roles or groups per organisation:** would put Herald's authorisation in the directory, need directory writes on every organisation change and leak organisation structure into tokens.
- **Membership projections in each module, fed by integration events:** respects module independence too, but revocation would lag the outbox and each module would duplicate access logic.
- **A backend-for-frontend with cookies:** keeps tokens out of the browser but adds a server to the CSR admin application; reconsider if the threat model changes.
- **Explicit `WHERE` clauses in handlers:** one forgotten filter leaks another organisation's data.

## Consequences

- Positive: one place decides membership and every module inherits it; a forgotten filter in a handler cannot leak; Herald's records survive a later move to another directory.
- Negative: Herald depends on a directory the maintainer administers by hand, shared with Arcana; assignment, recovery and relinks are manual operator work. Access tokens remain valid until they expire after an assignment is removed, so the role check alone is not instant revocation; membership removal is.
- Negative: global filters hide data silently; cross-organisation reads need explicit, tested exceptions.
- Follow-ups: reconsider RLS with M4's database roles; pilot API applications and their grants (D-12) in the API access slice; collaborator roles and invitations in H2; an organisation identifier in every message envelope with the first organisation-scoped integration event; ADR 0012's identity line points here.

Direction confirmed by the maintainer on 9 November 2026 (provider, filters and shadow properties, RLS if it fits). Implemented by `h1-organisation-access` and run against the real directory on 10 November 2026. Accepted by the maintainer on 10 November 2026.
