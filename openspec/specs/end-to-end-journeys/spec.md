# end-to-end-journeys Specification

## Purpose
A Playwright suite in `e2e/` runs Herald's critical journeys against the composed system, signing in through a fake OpenID Connect provider so the production sign-in code runs (ADR 0015).

## Requirements
### Requirement: The suite tests the running system
An end-to-end suite in the repository's `e2e/` folder SHALL start its own system before its journeys: PostgreSQL and a fake identity provider in containers, the host, the admin application and the public application's server rendering. It SHALL reach the system only through the browser, and SHALL leave no containers or processes running when it ends, whether it passes or fails.

#### Scenario: One command runs the suite
- **WHEN** a contributor with Docker, .NET and Node runs the suite's documented command from a clean checkout
- **THEN** the system starts, every journey runs in Chromium, and everything the suite started is stopped at the end

#### Scenario: Journeys do not share data
- **WHEN** two journeys run in the same suite
- **THEN** each uses its own people and organisations, so neither depends on the other's data or order

### Requirement: Sign-in runs through real protocol code
The suite SHALL sign people in through a fake OpenID Connect provider with authorisation code and PKCE, so the admin application's MSAL code and the host's JWT bearer validation run unchanged. The provider SHALL offer the suite's personas, each with directory and object identifiers, a display name and whether it holds the organiser role, and SHALL be able to issue a session that expires during a journey. Sign-in against the real directory SHALL remain a manual check.

#### Scenario: A persona signs in
- **WHEN** a journey signs in as an assigned persona
- **THEN** the admin application completes the redirect with that persona's token and the host accepts it

#### Scenario: The fake provider stays out of production
- **WHEN** the host starts in any environment other than the local or CI end-to-end environment with the fake provider's configuration
- **THEN** nothing in that environment's configuration names the fake provider, and the `E2E` environment cannot start in Production

### Requirement: The critical journeys are covered
The suite SHALL cover these journeys, each as one test named as a sentence:

1. A visitor on the public page follows Sign in to the admin application.
2. A signed-out person opening a deep link signs in and returns to that address.
3. A newcomer creates an organisation, lands in its workspace with the created notice, and sees its name in the rail.
4. An owner of two organisations switches through the selector, and another tab of the application reloads into its own organisation.
5. A person opening another owner's organisation by its address sees the generic denial, with nothing of that organisation.
6. A person not assigned to Herald is shown "Herald access is by invitation".
7. A session that expires while a person types sees "Sign in again", with their input kept for copying and nothing submitted.
8. Leaving the creation form with typed input asks first, and declining keeps the page and the input.
9. Signing out reloads the application's other tabs and asks for sign-in again.

#### Scenario: Each journey checks what the person sees
- **WHEN** a journey runs
- **THEN** it asserts on roles, labels and text a person perceives, not on implementation details such as CSS classes or stored state

### Requirement: Visited pages are accessible
Every distinct page or state a journey reaches SHALL pass an automated accessibility check, with the same rule exceptions as the component tests.

#### Scenario: An inaccessible state
- **WHEN** a journey reaches a state with an automatically detectable accessibility violation
- **THEN** the journey fails and names the violation

