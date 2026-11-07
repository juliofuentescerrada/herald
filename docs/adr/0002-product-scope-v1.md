# 0002. Game-agnostic product foundation and historical delivery scope

- Status: Superseded by 0013 for delivery scope
- Date: 2026-11-06
- Consolidated: 2026-11-07

## Context

Herald has to be small enough to finish and rich enough that its architecture is justified: rules that a form validation can't express, more than one bounded context, processes that last over time, and reads shaped differently from writes. Tournaments have all four. The maintainer already knows the domain, so the effort goes into the design, not into learning the domain.

A tournament for a card game, chess or padel differs in details (draws, points, tiebreakers, best-of-three) but not in shape.

## Decision

The original proposal grouped three individual competition systems into v1:

- **League**: everyone plays everyone (round robin), points per result, a table.
- **Knockout**: a single-elimination bracket, byes when the field isn't a power of two, the winner advances.
- **Single match**: two players, one result.

That delivery grouping is historical. ADR 0013 and the functional roadmap now govern delivery: H1 is an operator-run individual or direct-team league with scoped identity, web/API, guests, fixed rosters/lineups, aggregate results and public following by link. H2 adds the participant portal and reporting/confirmation; H3 adds elimination and single match. Teams and the API are not deferred optional extensions.

The core is game-agnostic. A game's rules are a **policy** (draws allowed or not, points per win, draw and loss, tiebreakers, matches of one game or best of three), chosen when the tournament is created. A game's data enters through an adapter.

Retained boundary: the core contains no publisher-owned content. Payments, monetary prizes and advanced scheduling remain outside the initial delivery. Basic table/server/time assignments may be exposed by H1 without promising an advanced scheduling engine. Swiss, richer profiles and further systems follow the functional roadmap.

## Alternatives considered

- **A tournament manager for one game:** more concrete, but the domain would leak game rules everywhere and read as a fan project rather than a reference.
- **Swiss in v1:** the most interesting pairing algorithm, and the format card games use most; left for after v1 because league and knockout already exercise every architectural piece.
- **A different domain** (bookings, expenses, subscriptions): considered; tournaments were chosen for their rules and because the domain is already known.

## Consequences

- Positive: three formats share one model and differ in a strategy, which is the kind of variation DDD is good at.
- Negative: game-agnostic means some generality the first game doesn't need; the policy has to stay small to avoid becoming a rules engine.
- Follow-ups: use ADR 0013 and the functional decision ledger for current milestones and profile decisions. External clients are part of H1's API contract; real connected execution is refined in H4.
