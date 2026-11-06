# 0009. Azure Service Bus through Wolverine; MediatR and MassTransit left out for their licences

- Status: Proposed
- Date: 2026-11-06

## Context

Integration events need a broker in Azure. Herald is a public, personal, open-source project, so every dependency has to be free for that use, in the version that would be installed.

Checked on 2026-11-06:

- **MediatR 14.3.0** (latest): the package licence offers the Reciprocal Public License 1.5 or Lucky Penny Software's commercial licence. Its community tier is free for individuals and small organisations but needs a registered licence key, and RPL 1.5 would push its reciprocal terms onto Herald's MIT code.
- **MassTransit 9.2.5** (latest): the package README says it "is a commercial product that must be licensed". The only free option its vendor lists is a full discount for non-profit organisations under 1 million USD in annual expenses, which a personal project is not. Version 8 is Apache 2.0, but its announced support ends with 2026.
- **WolverineFx 6.62.0** (latest) and the packages Herald would use (`EntityFrameworkCore`, `PostgreSQL`, `AzureServiceBus`, `Http`, `FluentValidation`): MIT, targeting .NET 10.

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
- Follow-ups: in M0, check the Azure Service Bus emulator under Aspire with Wolverine's transport (its resource creation may need the emulator's configuration file instead); if it doesn't work, use Wolverine's PostgreSQL transport locally and record it.
