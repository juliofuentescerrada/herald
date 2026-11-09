# 0015. Test complete journeys end to end, signing in through a fake OpenID Connect provider

- Status: Proposed
- Date: 2026-11-09

## Context

ADR 0010 plans Playwright for a few complete journeys. Herald's first journeys (sign-in, organisation creation and switching, isolation, access states) cross every layer: MSAL in the admin application, JWT bearer validation in the host, the membership step, the persistence filter and the public application's link into the admin one. Each layer has its own tests, but a defect between layers, such as an authority the browser and the host need in different forms, appears only when they run together.

Sign-in is the obstacle. The real External ID directory signs people in with e-mail one-time passcodes and has no disposable users; a suite in CI cannot use it. Faking the session inside the application would skip exactly the code most likely to break between layers.

## Decision

- **A fake OpenID Connect provider:** the end-to-end suite signs people in through `navikt/mock-oauth2-server`, a test provider that speaks the real protocol (discovery, JWKS, authorisation code with PKCE, signed tokens) and issues the suite's personas with the directory's claim names. MSAL and JWT bearer run unchanged; only configuration points them at the provider. If MSAL cannot work with it, a minimal provider written for the suite replaces it, with the same contract.
- **A root `e2e/` folder:** the suite tests the whole system, so it sits at the repository root with its own toolchain (Playwright, TypeScript, Chromium), not inside the Angular workspace.
- **Its own environment:** the host runs the suite in an `E2E` environment without Azure Service Bus, guarded against production.
- **The real directory stays a manual check** before a release.

## Alternatives considered

- **A fake session injected into the admin application:** simplest, but MSAL, the redirect, discovery and token validation would go untested.
- **MockServer or another response stub:** cannot sign a fresh token with the request's nonce, which MSAL checks.
- **The real directory with test users:** one-time passcodes cannot be automated, and CI would depend on an external tenant.
- **Playwright for .NET with Aspire's testing host:** composes the real AppHost, but brings the Service Bus emulator into every run, beyond the local Docker budget.
- **`web/e2e`:** reuses the front end's install and CI job, but misplaces a system-level suite.

## Consequences

- Positive: the production sign-in code runs in every pull request; cross-layer defects show up before review; journeys document the critical paths as executable sentences.
- Negative: a fake provider can differ from External ID (claims, issuer shape, error codes), so the real directory still needs a manual pass; the suite adds minutes and a container image to every pull request; the host gains an environment that must never reach production.
- Follow-ups: revisit the provider if External ID adds a testable sign-in method; add journeys with each H1 feature; reconsider running only on relevant paths once the suite's duration is known.

Direction proposed by `e2e-critical-paths`; nothing is confirmed or implemented yet.
