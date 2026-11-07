# 0005. CQRS inside each module, with Wolverine as the in-process bus

- Status: Proposed
- Date: 2026-11-06
- Consolidated: 2026-11-07
- Revised: 2026-11-08 (M0 follow-ups answered by `m0-messaging`)

## Context

Writes and reads in Herald have different shapes. Reporting a result loads one match, checks its rules and changes it. A league table or a bracket is read far more often, joins many matches, and is easier to keep ready than to compute on every request.

The use cases need a pipeline: validation, a transaction, the outbox (ADR 0008), logging and tracing, applied the same way to every command.

## Decision

Separate commands from queries in every module:

- A **command** changes state through the owning aggregate's invariants. Its response may include the created identity, operation receipt, applied/rejected/pending outcome and relevant revision or error metadata. It does not construct an unrelated read model or pretend an eventually updated projection is current. Read that projection through its query.
- A **query** never loads an aggregate and never changes state. It projects to a read model with no tracking, or reads a table that a projection maintains (the Standings module).

Commands, queries and the handlers of domain and integration events run through **Wolverine** (`WolverineFx`, MIT, 6.62.0 when this was written): its in-process bus invokes the handlers, and its middleware gives the pipeline (validation with `WolverineFx.FluentValidation`, transactions with `WolverineFx.EntityFrameworkCore`). HTTP endpoints use `WolverineFx.Http`, so an endpoint is a handler too.

Wolverine is an adapter concern. `Domain` doesn't reference it; a module's `Features` (its endpoints and handlers, ADR 0004) may use its attributes and return values, and everything else Wolverine-specific stays in the module's composition, `Herald.ModuleHosting` and the host.

**Wolverine's code** (answered in `m0-messaging`): Wolverine generates the code that runs each handler. In Development and tests it is generated and compiled at run time (`WolverineFx.RuntimeCompilation`); elsewhere the host runs the code pre-generated with `dotnet run --project src/Herald.Host -- codegen write` and committed in `Herald.Host/Internal/Generated`, compiling nothing. CI regenerates it and fails on any difference, the only reliable guard: in static mode Wolverine knows only the handlers in its generated registry, so a handler added without regenerating would otherwise fail on first use. Measured in the spike, pre-generated code saved about 1.8 s on the first message of a cold process.

**OpenAPI** (answered in `m0-messaging`): Wolverine's HTTP endpoints appear in the ASP.NET Core OpenAPI document (`Microsoft.AspNetCore.OpenApi`) with route, method and response type, proved by a probe endpoint. The host serves it at `/openapi/v1.json` in Development; writing it at build time and generating the client belong to `m0-web-shell` (ADR 0011), and what Azure exposes to M4.

Each feature owns its HTTP request/response and typed business errors; those contracts are distinct from aggregates and integration events. An HTTP endpoint and its use case can share a method without introducing an extra service/dispatcher layer. Queries may use their own module's persistence directly. Shared business behaviour is expressed in Domain, not by calling another feature's handler.

H1 mutation contracts preserve operation identity across retries and use expected revisions to reject stale intent. The same operation identity/content returns its original receipt; changed content conflicts. A revision conflict requires a new review, not blind retry. Functional discovery defines the consumer behaviour; the implementing slice specifies the concrete HTTP contract and receipt retention.

## Alternatives considered

- **MediatR:** the usual choice for in-process mediation. Since version 13 it is dual-licensed (RPL 1.5 or a commercial licence, with a free community tier that needs a licence key); see ADR 0009. It also covers only mediation, so the outbox and the transport would come from elsewhere.
- **A small hand-written dispatcher:** no dependency, but the pipeline, the outbox integration and the retries would all be Herald's own code.
- **Plain endpoints calling application services:** least indirection; the pipeline would be repeated or hidden in filters, and the command/query split would be a naming convention only.

## Consequences

- Positive: one library covers mediation, the outbox, the transport and retries, so the pieces fit together; handlers are plain classes and easy to test.
- Negative: Wolverine works by convention and generates code, which is less explicit than an interface per handler and new to the maintainer; error messages have to be watched, and the committed generated code must be regenerated with every handler or endpoint change.
- Follow-ups: the M0 follow-ups are answered above. With H1's first handler, confirm that the host handles a message in Production on the pre-generated code.
