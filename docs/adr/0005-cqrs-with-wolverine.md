# 0005. CQRS inside each module, with Wolverine as the in-process bus

- Status: Proposed
- Date: 2026-11-06

## Context

Writes and reads in Herald have different shapes. Reporting a result loads one match, checks its rules and changes it. A league table or a bracket is read far more often, joins many matches, and is easier to keep ready than to compute on every request.

The use cases need a pipeline: validation, a transaction, the outbox (ADR 0008), logging and tracing, applied the same way to every command.

## Decision

Separate commands from queries in every module:

- A **command** goes through an aggregate, changes state and returns at most the id it created. It never returns read models.
- A **query** never loads an aggregate and never changes state. It projects to a read model with no tracking, or reads a table that a projection maintains (the Standings module).

Commands, queries and the handlers of domain and integration events run through **Wolverine** (`WolverineFx`, MIT, 6.62.0 when this was written): its in-process bus invokes the handlers, and its middleware gives the pipeline (validation with `WolverineFx.FluentValidation`, transactions with `WolverineFx.EntityFrameworkCore`). HTTP endpoints use `WolverineFx.Http`, so an endpoint is a handler too.

Wolverine is an adapter concern. `Domain` doesn't reference it; handlers in `Application` may use its attributes and return values, and everything else Wolverine-specific stays in the module's composition and the host.

## Alternatives considered

- **MediatR:** the usual choice for in-process mediation. Since version 13 it is dual-licensed (RPL 1.5 or a commercial licence, with a free community tier that needs a licence key); see ADR 0009. It also covers only mediation, so the outbox and the transport would come from elsewhere.
- **A small hand-written dispatcher:** no dependency, but the pipeline, the outbox integration and the retries would all be Herald's own code.
- **Plain endpoints calling application services:** least indirection; the pipeline would be repeated or hidden in filters, and the command/query split would be a naming convention only.

## Consequences

- Positive: one library covers mediation, the outbox, the transport and retries, so the pieces fit together; handlers are plain classes and easy to test.
- Negative: Wolverine works by convention and generates code at startup, which is less explicit than an interface per handler and new to the maintainer; startup time and error messages have to be watched.
- Follow-ups: in M0, check that Wolverine's HTTP endpoints appear in the OpenAPI document (ADR 0011) and decide whether to pre-generate Wolverine's code for production.
