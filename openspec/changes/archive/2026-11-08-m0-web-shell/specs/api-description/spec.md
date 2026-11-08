## MODIFIED Requirements

### Requirement: The host describes its HTTP endpoints
The host SHALL describe every HTTP endpoint, Wolverine's included, with its route, method, request and response types, in one of two OpenAPI documents: `public`, for endpoints the public/participant application uses, and `admin`, for administration. Every endpoint SHALL declare exactly one of these groups, and each document SHALL contain only its own group. The host SHALL serve both in Development; whether either is exposed in Azure is decided in M4.

#### Scenario: A Wolverine endpoint appears in the document
- **WHEN** a module exposes a Wolverine HTTP endpoint in the public group and both documents are requested
- **THEN** the public document contains the endpoint's route and method, and its response type, and the admin document does not contain it

#### Scenario: An endpoint without a group is rejected
- **WHEN** an HTTP endpoint declares no group
- **THEN** a host test fails naming the endpoint, instead of the endpoint being left out of both documents
