# deployment-pipeline Specification

## Purpose
How Herald is deployed to its two slots on the shared platform: a merge deploys `main` and keeps its data, and the slice pull request holding the `preview` label deploys `preview` with a reset and seeding, each followed by a smoke check and, for `preview`, a comment naming where to test and as whom (ADRs 0012, 0019; change `m4-deploy`).

## Requirements
### Requirement: A merge deploys main and keeps its data
A merge to `main` SHALL deploy the `main` slot as Herald's delivery identity from the `main` environment: its images, its infrastructure, its job (migrations and the scenarios not yet present) and then its apps, with no operator and without resetting its data.

#### Scenario: The main deployment's steps
- **WHEN** the deployment workflow is read for a push to `main`
- **THEN** its job runs in the `main` environment, applies the infrastructure, runs the seeding job without a reset before updating the apps, and its concurrency group does not cancel a running deployment

### Requirement: The preview slot belongs to one labelled pull request at a time
A slice pull request SHALL take `preview` by its `preview` label; while it holds the label, each push SHALL redeploy it with a reset and seeding; another pull request's label SHALL be refused while the slot is held; removing the label or closing the pull request SHALL release it.

#### Scenario: Labelling a pull request while the slot is free
- **WHEN** the `preview` label is added to a pull request and no other open pull request has it
- **THEN** the guard answers deploy

#### Scenario: Labelling a pull request while another holds the slot
- **WHEN** the `preview` label is added to a pull request while another open pull request has it
- **THEN** the guard answers refuse and names the holder

#### Scenario: A push to the holder redeploys it
- **WHEN** a pull request that has the `preview` label receives a push
- **THEN** the guard answers deploy

#### Scenario: Closing or removing the label releases the slot
- **WHEN** the holder is closed or loses its `preview` label
- **THEN** the guard answers release, and a pull request labelled afterwards is answered deploy

### Requirement: Preview deployments never apply infrastructure
A `preview` deployment SHALL deploy images, run the job with its reset and update the apps, and SHALL NOT apply the infrastructure, which applies from `main` only.

#### Scenario: The preview deployment's steps
- **WHEN** the deployment workflow is read for a `preview` deployment
- **THEN** its job runs in the `preview` environment and has no `tofu apply` step

### Requirement: A deployment is checked and reported
After updating the apps, a deployment SHALL check that the public home page, an API request through it and the admin's configuration answer, record the first response times, and for `preview` comment on the pull request with the addresses, the personas' names and the test script, never a password or an object id.

#### Scenario: The pull request comment carries no identifiers
- **WHEN** the comment for a `preview` deployment is composed
- **THEN** it contains the two addresses and the personas' names, and no object id, tenant id or password
