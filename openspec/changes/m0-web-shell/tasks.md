## 1. Review gates

- [x] 1.1 Review this draft against ADR 0011 and confirm its shell-only scope; record implementation approval before production changes (8 November 2026: approved by the maintainer)
- [x] 1.2 Reuse the referenced mockups where sufficient and obtain/review missing admin/public shell, narrow-screen, control and recovery states; record references in design.md (8 November 2026: shell-state prototype and captures approved)
- [x] 1.3 Resolve W-01–06 with exact versions, licences, generator/transport, UI foundation, catalogue, boundary checks and state/rendering decisions (8 November 2026: all recorded in design.md; W-03 is confirmed by task 3.1's experiment)
- [x] 1.4 Coordinate OpenAPI export, host/AppHost/CI ownership and integration order with m0-messaging without changing its transport design (8 November 2026: `m0-messaging` is archived; what it delivered, the constraints it leaves and this change's ownership are recorded in design.md; the export mechanism is part of W-04)

## 2. Workspace and dependency boundaries

- [x] 2.1 Create the reviewed workspace with admin/public applications, separate ui/api-client libraries and explicit public entry points
- [x] 2.2 Establish app composition, platform and local presentation boundaries without precreating product feature hierarchies
- [x] 2.3 Add CI import checks for relative/alias/barrel/dynamic imports, cross-feature/app access and library internals; discover new features automatically
- [x] 2.4 Verify allowed imports pass and temporary forbidden-import fixtures fail with actionable source/target diagnostics
- [x] 2.5 Provide the `QueryClient` through a token, the platform context with `replace()` (full load and `BroadcastChannel`) and scoped query keys; verify reset and cross-tab reload with fixtures without production sign-in

## 3. Shared UI and shells

- [x] 3.1 Run the W-03 experiment on a throwaway scaffold before any ui code: ng-primitives button (all states) and tabs with Herald tokens and radius 0, prerendered catalogue page with clean hydration, Vitest keyboard/focus and axe checks, and a failing lint for an app importing ng-primitives; record the result in design.md, reopening W-03 if it fails
- [x] 3.2 Implement only reviewed shell controls/tokens in ui and consume them from both apps with square corners and the documented scale, with Tabler outline icons (`@tabler/icons-angular`) exposed only through ui
- [x] 3.3 Add the development-only catalogue project (prerendered, never deployed); cover relevant keyboard, focus, error, disabled/loading and recovery states
- [x] 3.4 Implement reviewed admin CSR and public shell layouts at desktop/narrow widths without tournament or participant functionality
- [x] 3.5 Review blur/grayscale hierarchy, spacing, typography, contrast, reading order and keyboard/error recovery; record actual evidence

## 4. Rendering and local environment

- [ ] 4.1 Configure the W-05 render modes, the 404 route and the development-only fixtures; verify the prerendered page has initial HTML and hydrates, and that production artifacts contain no fixtures
- [ ] 4.2 Verify with concurrent requests that the SSR fixture isolates providers and query state, that the server transport strips credentials, and that TanStack queries render on the server (synchronous `notifyManager` scheduler)
- [ ] 4.3 Implement the server `HttpBackend` rewrite to `HERALD_API_URL`, verify the browser makes no repeat request on hydration, and defer real API-backed tournament metadata/visibility/cache acceptance to its feature change
- [ ] 4.4 Start both web apps through Aspire alongside the existing services (one pnpm installer, `HERALD_API_URL`, dev `/api` proxy) and verify reachable URLs and API calls from browser and SSR
- [ ] 4.5 Build both production apps and verify the public app's static/server output without creating cloud resources

## 5. Generated API contract

- [ ] 5.1 Split `AddHeraldApi` into public and admin documents with strict group inclusion, add the host test that fails for an ungrouped endpoint, update the existing document tests, and export both with Wolverine's `openapi` command without a database, credentials or schema mutation
- [ ] 5.2 Generate and commit both OpenAPI documents and their orval clients behind `@herald/api-client/public` and `/admin`, with pinned tooling and config, explicit operation ids, the `ProblemDetails` error adapter, including representative typed response/error fixtures
- [ ] 5.3 Verify the generated client has no UI/navigation/business cache policy and remains usable through reviewed browser/server transport configuration
- [ ] 5.4 Add CI regeneration checks; prove a stale document/client fails and two unchanged generations produce no diff

## 6. Completion

- [ ] 6.1 Run the agreed frontend builds/tests, boundary checks, rendering/isolation checks and combined startup; record commands, versions and results in design.md
- [ ] 6.2 Update actual commands/status in README, CLAUDE, roadmap and ADR 0011 follow-ups without marking H1 functionality complete
- [ ] 6.3 Validate the implemented change, review its acceptance and archive it only after every completion gate passes
