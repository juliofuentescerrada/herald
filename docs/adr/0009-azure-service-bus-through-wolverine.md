# 0009. Azure Service Bus through Wolverine; MediatR and MassTransit left out for their licences

- Status: Proposed
- Date: 2026-11-06

## Context

Integration events need a broker in Azure. Herald is a public, personal, open-source project, so every dependency has to be free for that use, in the version that would be installed.

Historical package assessment recorded on 2026-11-06; recheck the exact selected versions and their vendor terms before installation. The consolidation does not assert that these are still the latest releases:

- **MediatR 14.3.0**: the recorded assessment identified reciprocal/commercial terms and a community registration/key requirement, adding licensing obligations the project preferred to avoid.
- **MassTransit 9.2.5**: the recorded assessment identified commercial licensing; version 8's older licensing/support position was not selected as the foundation for a new project.
- **WolverineFx 6.62.0** and the candidate integration packages (`EntityFrameworkCore`, `PostgreSQL`, `AzureServiceBus`, `Http`, `FluentValidation`): recorded as MIT and compatible with the planned .NET stack. The messaging change records the exact packages ultimately used.

## Decision

Use **Azure Service Bus** (topics and subscriptions, one topic per publishing module) through Wolverine's transport, `WolverineFx.AzureServiceBus`, with managed identity in Azure. Use Wolverine for in-process mediation too (ADR 0005). Don't use MediatR or MassTransit.

## Alternatives considered

- **MassTransit 9 with a commercial licence:** the most mature option, too expensive for a personal project.
- **MassTransit 8 (Apache 2.0):** free today, but out of support as Herald starts.
- **MediatR 14 with a community licence key:** possible, but the key becomes a secret every contributor and pipeline needs, and Wolverine covers the same need.
- **The Azure Service Bus SDK behind a port of our own:** no framework, full control; the outbox, the inbox, retries and consumers would all be Herald's code (ADR 0008).
- **RabbitMQ or Wolverine's PostgreSQL transport:** cheaper, but Azure Service Bus is the managed broker a reader expects in an Azure reference.

## Consequences

- Positive: one MIT library for mediation, outbox, inbox and transport; the broker is replaceable through Wolverine's transports.
- Negative: Herald depends heavily on Wolverine; if its licence changes, this ADR is superseded and the cost of leaving is real. Licence terms checked on a date age.
- Follow-ups: the `m0-messaging` spike checks the local emulator, transport and provisioning. A failed assumption requires a revised decision in that change; this ADR does not preselect a fallback broker or store topology. Preserve that work in its own branch.
