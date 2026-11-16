# pilot-access Specification

## Purpose
Pilot server applications act for an organisation only within a revocable grant its owner records, by tournament and operation group, and what they record names them as its source (D-12, D-14; `docs/operations/identity.md` section 7).

## Requirements
### Requirement: An owner grants a pilot application scoped access
An organisation's owner SHALL grant an application access by its application identifier, with a name, the tournaments it covers (all or selected) and the operation groups it may perform (read, tournament setup, entries, schedule, results and corrections, finalisation), and SHALL revoke it. A grant SHALL be kept with who granted and revoked it and when. An application SHALL have at most one active grant per organisation.

#### Scenario: Granting results for one tournament
- **WHEN** an owner grants "Results bot" the read and results groups for Saturday Open
- **THEN** the Applications page lists the grant as active with that tournament and those groups

#### Scenario: Revoking
- **WHEN** an owner revokes the grant
- **THEN** it is listed as revoked with the owner and the time

### Requirement: An application acts only within its grant
A request from an application with the pilot role SHALL be accepted only for an organisation where it has an active grant, for a tournament the grant covers and for an endpoint in a granted group. Without an active grant the response SHALL be the generic organisation denial; outside its tournaments or groups it SHALL be refused naming the group, with no tournament content. Revocation SHALL take effect from the next request; an operation already applied SHALL keep its effect and authorship.

#### Scenario: Outside the grant
- **WHEN** "Results bot", granted results for Saturday Open, records a result in Sunday Cup of the same organisation
- **THEN** the request is refused and nothing of Sunday Cup is returned

#### Scenario: Another organisation
- **WHEN** the application reads a private tournament of an organisation that granted it nothing, by its identifier
- **THEN** the response is the generic denial

#### Scenario: After revocation
- **WHEN** the owner revokes the grant and the application then records a result with a token issued before
- **THEN** the request is refused and the earlier results stay, attributed to the application

### Requirement: Application writes record their source
A write by an application SHALL record the application, through its grant, as the actor, and history SHALL show its name and the owner who granted it.

#### Scenario: A result by an application
- **WHEN** "Results bot" records a win
- **THEN** the match shows it was recorded by "Results bot (granted by Alex Morgan)"

