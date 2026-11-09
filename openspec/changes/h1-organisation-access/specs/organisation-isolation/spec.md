## ADDED Requirements

### Requirement: Organisation-scoped requests resolve membership first
An endpoint acting on an organisation SHALL take the organisation from its route and SHALL resolve the caller's membership in it before any handler runs. Without a current membership the response SHALL be the same 404 problem as for an organisation that does not exist, with no organisation name, tournament or other private detail. Every request SHALL be checked; a membership seen earlier SHALL grant nothing later.

#### Scenario: Another organisation's owner reads by direct identifier
- **WHEN** the owner of organisation A requests organisation B's details with B's identifier
- **THEN** the response is the generic 404 and contains nothing about B

#### Scenario: Another organisation's owner writes by direct identifier
- **WHEN** the owner of organisation A sends a mutation to an organisation-B route
- **THEN** the response is the generic 404, no handler runs and B is unchanged

#### Scenario: Membership is removed between requests
- **WHEN** the platform operator removes a person's membership and that person then calls the organisation's endpoints
- **THEN** each call receives the generic 404

### Requirement: Persistence scopes organisation-owned data
Organisation-owned entities SHALL carry the owning organisation as a persistence-only property, outside the domain model. Queries through a module's `DbContext` SHALL return only the current request's organisation's rows. Writes SHALL stamp new rows with the current organisation and SHALL fail when a tracked row belongs to another organisation. Code that needs data across organisations (such as a person's own memberships) SHALL do so explicitly, and a test SHALL show where.

#### Scenario: A query without a filter in the handler
- **WHEN** a handler in organisation A's context queries an organisation-owned set holding rows of A and B without filtering
- **THEN** it receives only A's rows

#### Scenario: A new row is saved
- **WHEN** a handler in organisation A's context adds an organisation-owned entity
- **THEN** the stored row belongs to A without the handler setting it

#### Scenario: A request has no organisation context
- **WHEN** code queries an organisation-owned set with no organisation context
- **THEN** it receives no rows instead of every organisation's rows

### Requirement: The database-level guard is decided by evidence
The change SHALL run a bounded experiment with PostgreSQL row-level security on an organisation-owned table, setting the organisation per transaction, and SHALL record in its design whether it is adopted, with the evidence. If adopted, a query that bypasses the EF Core filter SHALL still return only the current organisation's rows.

#### Scenario: The experiment concludes
- **WHEN** the experiment has run
- **THEN** the design records adopted or rejected, the measured behaviour with pooled connections, Wolverine handlers and migrations, and the reason
