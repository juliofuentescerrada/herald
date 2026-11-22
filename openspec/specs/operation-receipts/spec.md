# operation-receipts Specification

## Purpose
Every admin mutation carries an operation identity, and the module that applied it keeps a receipt in the same transaction, so a client that lost a response can learn what happened and retry safely (API-04, API-08, D-02; worked example in `docs/api/individual-league.md`).

## Requirements
### Requirement: Every mutation accepts an operation identity
Every admin mutation SHALL accept an operation identity. The same identity with the same content SHALL return the original outcome without a second effect; with different content it SHALL be rejected as a reused operation.

#### Scenario: A lost response
- **WHEN** a client admits an entry with operation identity A, loses the response and sends the same request again
- **THEN** one admission exists and the second response is the first one's

#### Scenario: A reused identity
- **WHEN** a client sends operation identity A again with a different result
- **THEN** it is rejected as a reused operation and nothing changes

### Requirement: Receipts tell what happened
A caller of an organisation SHALL read the receipt of an operation identity: `applied` with the resulting revision and resource, or `rejected` with the problem type. An unknown identity SHALL read `not-found`, meaning nothing was applied. Receipts SHALL be kept while their tournament exists and SHALL NOT be readable from another organisation.

#### Scenario: Reconciling a result
- **WHEN** a client's result request times out and the client reads its receipt
- **THEN** the receipt says `applied` with the match and its revision

#### Scenario: Never arrived
- **WHEN** a client reads the receipt of an operation the host never received
- **THEN** the answer is `not-found`, and sending the request with that identity applies it once

#### Scenario: Another organisation
- **WHEN** a caller reads a receipt of another organisation's operation by its identity
- **THEN** the answer is the generic denial

