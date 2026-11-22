# Worked example: a direct-team league through the API

A team league follows the [individual example](individual-league.md) with the differences below: what it says about access, operation identities, receipts, expected revisions and other modules applies unchanged. A client that only supports individual play reads `configuration.entryKind` (or the field's `terms.entryKind`) and refuses a `team` tournament instead of treating a team as a player.

## What differs

1. **Configuration.** `entryKind` is `team`, with the roster bounds and the players each side fields:

   ```json
   { "entryKind": "team", "minimumRosterSize": 5, "maximumRosterSize": 7, "activePlayersPerSide": 5, "…": "as the individual example" }
   ```

2. **Entries are teams.** `PUT /guests/{teamId}` `{ "kind": "team", "name": "River Falcons", "confirmNew": true }`, then `PUT /tournaments/{t}/entries/{entryId}` `{ "guestId": "{teamId}" }`. The entry (`entryId`) is the competitive side; the team guest is not.
3. **Rosters.** Each team's players are guest players (`kind: "player"`). Add each with `PUT /tournaments/{t}/entries/{entryId}/roster/members/{playerId}` `{ "expectedRevision": <roster revision> }`, reading `GET /tournaments/{t}/entries/{entryId}/roster` for its `revision`. A player on another team's roster is refused with that team. Start waits until every admitted team's roster is within its bounds; rosters are frozen at start.
4. **Lineups and the match start.** A team match is not resolved in one step. Read the match (`GET /tournaments/{t}/matches/{matchId}`): each side's `roster` lists its frozen players by `playerId`. Record each side's lineup with `PUT /tournaments/{t}/matches/{matchId}/lineups/{first|second}` `{ "expectedRevision": <match revision>, "players": [ …five playerIds… ] }`, then `POST /tournaments/{t}/matches/{matchId}/start` `{ "expectedRevision": <match revision> }`, which locks both lineups.
5. **Results.** `POST /tournaments/{t}/matches/{matchId}/result` as in the individual example, once the match has started; before, a played result is `400` with `match: not-started`. The match's `appearances` credit the locked starters only.

Pairings, results and standings reference entries (`entryId`) in both kinds; `playerId` names a guest player on a roster, a lineup or an appearance, never a side.
