## ADDED Requirements

### Requirement: The API describes identifiers, errors and examples
The admin API description SHALL name each identifier for what it identifies (tournament, entry, guest player, team, roster, lineup), SHALL reference entries from pairings and results, SHALL state the entry kind on tournaments and entries, SHALL require no team-only field in an individual operation, and SHALL list each operation's business errors. Worked examples of an individual and a direct-team league SHALL accompany it.

#### Scenario: A result request
- **WHEN** the description of the result operation is read
- **THEN** it references the match and its entries, requires no roster or lineup field for an individual match and lists its business errors

#### Scenario: An independent client
- **WHEN** a client with a pilot grant follows the individual example for four players
- **THEN** it obtains six matches and the same final standings as the admin application, without Angular
