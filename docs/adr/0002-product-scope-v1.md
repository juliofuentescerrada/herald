# 0002. Product scope of v1: game-agnostic tournaments in three formats

- Status: Proposed
- Date: 2026-11-06

## Context

Herald has to be small enough to finish and rich enough that its architecture is justified: rules that a form validation can't express, more than one bounded context, processes that last over time, and reads shaped differently from writes. Tournaments have all four. The maintainer already knows the domain, so the effort goes into the design, not into learning the domain.

A tournament for a card game, chess or padel differs in details (draws, points, tiebreakers, best-of-three) but not in shape.

## Decision

v1 runs tournaments for individual players in three formats:

- **League**: everyone plays everyone (round robin), points per result, a table.
- **Knockout**: a single-elimination bracket, byes when the field isn't a power of two, the winner advances.
- **Single match**: two players, one result.

It covers registration (capacity, waiting list, closing), the schedule or bracket, reporting and confirming results, and live standings.

The core is game-agnostic. A game's rules are a **policy** (draws allowed or not, points per win, draw and loss, tiebreakers, matches of one game or best of three), chosen when the tournament is created. A game's data enters through an adapter.

Out of v1: Swiss pairing, teams, payments, prizes, scheduling of tables and times, and any content owned by a game publisher.

## Alternatives considered

- **A tournament manager for one game:** more concrete, but the domain would leak game rules everywhere and read as a fan project rather than a reference.
- **Swiss in v1:** the most interesting pairing algorithm, and the format card games use most; left for after v1 because league and knockout already exercise every architectural piece.
- **A different domain** (bookings, expenses, subscriptions): considered; tournaments were chosen for their rules and because the domain is already known.

## Consequences

- Positive: three formats share one model and differ in a strategy, which is the kind of variation DDD is good at.
- Negative: game-agnostic means some generality the first game doesn't need; the policy has to stay small to avoid becoming a rules engine.
- Follow-ups: Swiss and a first game profile (for example a card game with best-of-three and its usual tiebreakers) as later milestones; a simulated-results adapter as an optional one.
