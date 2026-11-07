# api-description Specification

## Purpose
The host describes its HTTP endpoints, Wolverine's included, in an OpenAPI document.

## Requirements
### Requirement: The host describes its HTTP endpoints
The host SHALL serve an OpenAPI document that describes every HTTP endpoint, Wolverine's included, with its route, method, request and response types. It SHALL serve it in Development; whether it is exposed in Azure is decided in M4.

#### Scenario: A Wolverine endpoint appears in the document
- **WHEN** a module exposes a Wolverine HTTP endpoint and the OpenAPI document is requested
- **THEN** the document contains the endpoint's route and method, and its response type

