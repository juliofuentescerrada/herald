# Roadmap

Each milestone ends with something that works end to end. From M0 on, every milestone is one or more OpenSpec changes (`/opsx:propose`), and its design notes and measurements go in the change's `design.md`.

| Milestone | Delivers | Exit criteria |
|---|---|---|
| **M0 Foundations** | .NET solution (`Herald.slnx`) with the AppHost, service defaults, building blocks, contracts, the three empty modules and the host; Wolverine wired to PostgreSQL and the broker; architecture tests; CI; the Angular workspace | CI green on format, build and tests; `dotnet run` on the AppHost starts PostgreSQL, the broker, the host and the web app; the ADR 0005, 0008 and 0009 follow-ups answered |
| **M1 League** | Registration (create a tournament, register, waiting list, close) and a league in Competition (round-robin schedule, report and confirm a result, finish), the league table in Standings, and the screens for each | A league of 4–8 players runs end to end in the browser; the table updates from integration events through the outbox; every rule has a test that reads as a sentence |
| **M2 Knockout and single match** | Bracket with byes and advancing winners; single match; the bracket view | Both formats run end to end; the format is a strategy, not a branch in handlers |
| **M3 Live and sign-in** | Live standings pushed to the browser; sign-in with Entra ID, organiser and player roles | Two browsers see a result appear without reloading; only the organiser can close registration |
| **M4 Cloud** | Azure Container Apps, PostgreSQL, Service Bus, Key Vault, managed identities, Application Insights, OpenTofu and deployment on merge | A merge to `main` deploys with no manual step; no secrets in the repository or the OpenTofu state; idle cost measured |
| **M5 Game policies** | Points, draws, best-of-three and tiebreakers as policies; a first game profile; Swiss pairing | Two different profiles give the expected tables on the same results |
| **M6 Simulated results (optional)** | A result-source adapter fed by a match simulator, behind its own port and an anti-corruption layer | A whole tournament runs from simulated results without changes to `Domain` |

Next: accept or revise ADRs 0001–0012, then propose M0.
