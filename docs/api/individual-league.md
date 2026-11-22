# Worked example: an individual league through the API

An independent client runs a four-player league from creation to final standings with the admin API, as end-to-end journey 30 (`e2e/journeys/api.spec.ts`) does step by step. The API description is the admin OpenAPI document (`/openapi/admin.json` in Development); each response lists its business errors as `x-problem-types`. For a team league, see [team-league.md](team-league.md).

## Before the client starts

- **Access.** The client is a server application with the `PilotApplication` role. It obtains its token with client credentials for the API's scope and sends it as `Authorization: Bearer …` (ADR 0015).
- **Grant.** An owner of the organisation grants the application the groups it needs, here all six, for all the organisation's tournaments (Applications page, or `PUT /api/organisations/{organisationId}/applications/{grantId}`). Without an active grant every request answers `404 organisation-not-available`; outside it, `403 operation-not-granted` naming the group.
- **Identifiers.** The client chooses every identifier it creates (tournaments, guests, entries) as a UUID and keeps it for retries.

Every path below starts with `/api/organisations/{organisationId}`; `{t}` is the tournament's identifier.

## Operation identities and receipts

Every mutation takes an `Operation-Id` header (described on each operation of the admin document), a UUID the client chooses per operation:

- The same identity with the same request returns the first response, with no second effect.
- The same identity with another request is `409 operation-reused`, and nothing changes.
- A command that carries `operationId` in its body (draft generation, results, corrections, departures) sends the same value in the header; a different one is `400` on `Operation-Id`.

A client that lost a response reads `GET /receipts/{operationId}`:

```json
{ "operationId": "…", "operation": "recordResult", "outcome": "applied", "revision": 2,
  "resource": "/api/organisations/…/tournaments/…/matches/…/result", "problemType": null, "at": "…" }
```

`applied` carries the resulting revision and resource; `rejected` carries the problem type. A rejection is final for its identity too: repeating it answers the same rejection, so after rereading, send the corrected request with a new `Operation-Id`. `404 not-found` means nothing was applied: sending the same request with the same identity applies it once. An application reads the receipts of its own operations. Receipts are kept while the tournament exists.

## Expected revisions and other modules

Each write names the revision it read (`expectedRevision`); a stale one is a `409 …-revision-conflict` with the current revision: reread and decide. Some steps are taken up by another module after the response (entries after registration opens, the schedule after it closes, standings after results): read the resource until it shows the change, as the steps say. A resource another module has not created yet answers `404`.

## Steps

1. **Create the tournament.** `POST /tournaments` → `201`, revision 1.

   ```json
   { "tournamentId": "{t}", "configuration": {
       "title": "API League", "gameVariant": "Example strategy · Standard variant", "entryKind": "individual", "capacity": 4,
       "registrationOpensAt": "2026-11-10T09:00:00", "registrationClosesAt": "2026-11-13T18:00:00", "plannedStartAt": "2026-11-14T10:00:00",
       "timeZone": "Europe/Madrid", "location": "online", "admission": "automatic", "checkIn": "optional", "visibility": "private" } }
   ```

   An individual tournament sends no roster or lineup field.
2. **Publish.** `POST /tournaments/{t}/publication` `{ "expectedRevision": 1 }` → revision 2.
3. **Open registration.** `POST /tournaments/{t}/registration/opening` `{ "expectedRevision": 2 }`. Read `GET /tournaments/{t}/entries` until `terms.registration` is `open`.
4. **Enter four players.** For each: `PUT /guests/{guestId}` `{ "kind": "player", "name": "Robin Vale", "confirmNew": true }`, then `PUT /tournaments/{t}/entries/{entryId}` `{ "guestId": "{guestId}" }`. Admission is automatic. The entry's identifier (`entryId`) is the competitive side from here on; `guestId` is the guest player.
5. **Close registration.** Read `GET /tournaments/{t}` until `admittedEntries` is 4, then `POST /tournaments/{t}/registration/closure` with its `revision`.
6. **Generate and publish the schedule.** Read `GET /tournaments/{t}/schedule` until `registrationClosed` is true and `eligible` is 4. `POST /tournaments/{t}/schedule/draft` `{ "operationId": "{id}", "expectedRevision": <schedule revision>, "seeding": "admissionOrder" }` with the same `Operation-Id`, then `POST /tournaments/{t}/schedule/publication` with the draft's `revision`.
7. **Start.** Read `GET /tournaments/{t}` until `schedulePublished` is true, then `POST /tournaments/{t}/competition/start` with its `revision`. The schedule now lists six matches, each with `first` and `second` entrants by `entryId`.
8. **Record six results.** For each match: `POST /tournaments/{t}/matches/{matchId}/result` `{ "operationId": "{id}", "expectedRevision": 1, "outcome": "first" }` (`first`, `second` or `draw`), with the same `Operation-Id`. An individual match starts and resolves in this one step.
9. **Recover a lost response.** If a result's response is lost, read `GET /receipts/{id}`: `applied` with the match's revision, or `not-found`, in which case send the same request again. Repeating the request with the same identity returns the original response either way.
10. **Finalise.** Read `GET /tournaments/{t}/schedule` until every match has a `result`; read `GET /tournaments/{t}/standings` until its `revision` equals the schedule's `resultsRevision`. `POST /tournaments/{t}/finalisation` `{ "reviewedRevision": <resultsRevision>, "expectedRevision": <schedule revision> }`.
11. **Read the final standings.** `GET /tournaments/{t}/standings` until `final` is set. Its `rows` are what the admin application's Standings page shows: position (shared when points are equal), entrant, resolved, won, drawn, lost and points (3 a win, 1 a draw).
