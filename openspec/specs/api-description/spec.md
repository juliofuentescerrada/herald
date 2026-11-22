# api-description Specification

## Purpose
The host describes its HTTP endpoints, Wolverine's included, in a public and an admin OpenAPI document.
## Requirements
### Requirement: The host describes its HTTP endpoints
The host SHALL describe every HTTP endpoint, Wolverine's included, with its route, method, request and response types, in one of two OpenAPI documents: `public`, for endpoints the public/participant application uses, and `admin`, for administration. Every endpoint SHALL declare exactly one of these groups, and each document SHALL contain only its own group. The host SHALL serve both in Development; whether either is exposed in Azure is decided in M4.

#### Scenario: A Wolverine endpoint appears in the document
- **WHEN** a module exposes a Wolverine HTTP endpoint in the public group and both documents are requested
- **THEN** the public document contains the endpoint's route and method, and its response type, and the admin document does not contain it

#### Scenario: An endpoint without a group is rejected
- **WHEN** an HTTP endpoint declares no group
- **THEN** a host test fails naming the endpoint, instead of the endpoint being left out of both documents

### Requirement: The API describes identifiers, errors and examples
The admin API description SHALL name each identifier for what it identifies (tournament, entry, guest player, team, roster, lineup), SHALL reference entries from pairings and results, SHALL state the entry kind on tournaments and entries, SHALL require no team-only field in an individual operation, and SHALL list each operation's business errors. Worked examples of an individual and a direct-team league SHALL accompany it.

#### Scenario: A result request
- **WHEN** the description of the result operation is read
- **THEN** it references the match and its entries, requires no roster or lineup field for an individual match and lists its business errors

#### Scenario: An independent client
- **WHEN** a client with a pilot grant follows the individual example for four players
- **THEN** it obtains six matches and the same final standings as the admin application, without Angular

