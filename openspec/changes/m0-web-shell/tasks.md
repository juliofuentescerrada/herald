## 1. Review gates

- [ ] 1.1 Review this draft against ADR 0011 and confirm its shell-only scope; record implementation approval before production changes
- [ ] 1.2 Reuse the referenced mockups where sufficient and obtain/review missing admin/public shell, narrow-screen, control and recovery states; record references in design.md
- [ ] 1.3 Resolve W-01–06 with exact versions, licences, generator/transport, UI foundation, catalogue, boundary checks and state/rendering decisions
- [ ] 1.4 Coordinate OpenAPI export, host/AppHost/CI ownership and integration order with m0-messaging without changing its transport design

## 2. Workspace and dependency boundaries

- [ ] 2.1 Create the reviewed workspace with admin/public applications, separate ui/api-client libraries and explicit public entry points
- [ ] 2.2 Establish app composition, platform and local presentation boundaries without precreating product feature hierarchies
- [ ] 2.3 Add CI import checks for relative/alias/barrel/dynamic imports, cross-feature/app access and library internals; discover new features automatically
- [ ] 2.4 Verify allowed imports pass and temporary forbidden-import fixtures fail with actionable source/target diagnostics
- [ ] 2.5 Configure TanStack Query/signals ownership and context scoping/reset hooks; verify isolation using fixtures without production sign-in

## 3. Shared UI and shells

- [ ] 3.1 Implement only reviewed shell controls/tokens in ui and consume them from both apps with square corners and the documented scale
- [ ] 3.2 Add a component/state catalogue as development tooling; cover relevant keyboard, focus, error, disabled/loading and recovery states
- [ ] 3.3 Implement reviewed admin CSR and public shell layouts at desktop/narrow widths without tournament or participant functionality
- [ ] 3.4 Review blur/grayscale hierarchy, spacing, typography, contrast, reading order and keyboard/error recovery; record actual evidence

## 4. Rendering and local environment

- [ ] 4.1 Configure selective SSG/SSR/CSR modes and verify a representative static public page has initial HTML and hydrates correctly
- [ ] 4.2 Verify the non-domain SSR fixture isolates mutable providers, credentials and query state across concurrent requests
- [ ] 4.3 Record the selected client transport/data-transfer strategy and defer real API-backed tournament metadata/visibility/cache acceptance to its feature change
- [ ] 4.4 Start both web apps through Aspire alongside the existing services with explicit API configuration and reachable URLs
- [ ] 4.5 Build both production apps and verify the public app's static/server output without creating cloud resources

## 5. Generated API contract

- [ ] 5.1 Implement the reviewed build-time OpenAPI export after endpoint-description integration is available; require no deployment credentials or schema mutation
- [ ] 5.2 Generate and commit the OpenAPI document and TypeScript client with pinned tooling and config, including representative typed response/error fixtures
- [ ] 5.3 Verify the generated client has no UI/navigation/business cache policy and remains usable through reviewed browser/server transport configuration
- [ ] 5.4 Add CI regeneration checks; prove a stale document/client fails and two unchanged generations produce no diff

## 6. Completion

- [ ] 6.1 Run the agreed frontend builds/tests, boundary checks, rendering/isolation checks and combined startup; record commands, versions and results in design.md
- [ ] 6.2 Update actual commands/status in README, CLAUDE, roadmap and ADR 0011 follow-ups without marking H1 functionality complete
- [ ] 6.3 Validate the implemented change, review its acceptance and archive it only after every completion gate passes
