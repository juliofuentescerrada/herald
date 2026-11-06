# Roadmap

Each milestone ends with something that works end to end. From M0 on, every milestone is one or more OpenSpec changes (`/opsx:propose`), and its design notes and measurements go in the change's `design.md`.

| Milestone | Delivers | Exit criteria |
|---|---|---|
| **M0 Foundations** | .NET solution (`Herald.slnx`) with the AppHost, service defaults, building blocks, contracts, the three empty modules and the host; Wolverine wired to PostgreSQL and the broker; architecture tests; CI; one Angular workspace with admin (CSR) and public/participant (hybrid) shells | CI green on format, build and tests; `dotnet run` on the AppHost starts PostgreSQL, the broker, the host and both web apps; representative public prerendering and hydration verified; the ADR 0005, 0008 and 0009 follow-ups answered |
| **M1 League** | Registration (create a tournament, register, waiting list, close) and a league in Competition (round-robin schedule, report and confirm a result, finish), the league table in Standings, and the screens for each | A league of 4–8 players runs end to end in the browser; the table updates from integration events through the outbox; every rule has a test that reads as a sentence |
| **M2 Knockout and single match** | Bracket with byes and advancing winners; single match; the bracket view | Both formats run end to end; the format is a strategy, not a branch in handlers |
| **M3 Live and sign-in** | Live standings pushed to the browser; sign-in with Entra ID, organiser and player roles | Two browsers see a result appear without reloading; only the organiser can close registration |
| **M4 Cloud** | On the shared platform (planned infrastructure repository, ADR 0012): Herald's container apps, database, Service Bus topics, Key Vault, managed identities, Application Insights, OpenTofu and deployment on merge | A merge to `main` deploys with no manual step; no secrets in the repository or the OpenTofu state; idle cost measured |
| **M5 Game policies** | Points, draws, best-of-three and tiebreakers as policies; a first game profile; Swiss pairing | Two different profiles give the expected tables on the same results |
| **M6 Simulated results (optional)** | A result-source adapter fed by a match simulator, behind its own port and an anti-corruption layer | A whole tournament runs from simulated results without changes to `Domain` |

Frontend scope (ADR 0011): `m0-web-shell` creates one workspace with two app shells: admin (CSR) and public/participant (hybrid), sharing UI, tokens and the generated API client. Its exit criteria include starting both apps through Aspire and verifying a representative prerendered public page and hydration. The complete corporate site and discovery flows are outside M0. The first public tournament page verifies API-backed SSR, metadata and visibility/cache isolation; M4 supplies the SSR runtime alongside static asset hosting and measures SSR/API cold starts.

Component scope (ADR 0011): M0 creates an internal `ui` library consumed by both shells, separate from `api-client`, with only the shared pieces those shells require. Features retain their own components and app-local shared pieces. Add a component/state catalogue as development tooling with the first controls; no third product app, independently versioned UI package or complete component system is required in M0.

Next: accept or revise ADRs 0001–0012, then propose M0. M4 waits for the shared platform repository, which will take the costly shared resources out of Arcana's state; it is not designed yet.
