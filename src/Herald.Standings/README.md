# Standings module

Owns each tournament's standings as a projection of Competition's effective results (ADR 0004, ADR 0007).

- **Consumes** `TournamentResultsChanged` v1 (`Herald.Contracts`) on its durable local queue, `standings`, and keeps the snapshot with the highest revision (ADR 0016).
- **Computes** the table on read from that snapshot (`Domain/Table.cs`): 3/1/0 from effective results only, shared positions on equal points, each entrant's points explained.
- **Serves** `GET /api/organisations/{organisationId}/tournaments/{tournamentId}/standings` (Admin API), with the results revision the table reflects.
- **Publishes** nothing; standings are not a notifiable fact (ADR 0017).

The rules are in `openspec/specs/standings/spec.md`; the design in `h1-standings`'s archived `design.md`.
