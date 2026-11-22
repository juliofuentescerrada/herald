## ADDED Requirements

### Requirement: Each process has its own non-root image
Herald SHALL have one image each for the host (`api`), the seeding job (`seed`), the public SSR server (`public`) and the admin application (`admin`), each running as a non-root user and packaging what the pipeline's build produced.

#### Scenario: Every image runs as a non-root user
- **WHEN** the four images are built
- **THEN** none of them runs its entry point as root

### Requirement: The host's image contains no seeding or test code
The `api` image SHALL contain the published host only, without the seeding tool or the shared test support.

#### Scenario: The seeding tool is absent from the host's image
- **WHEN** the `api` image is built
- **THEN** it contains no `Herald.Seed` or `Herald.Testing` assembly, while the `seed` image contains both

### Requirement: The admin image carries no directory identifiers
The `admin` image SHALL contain no `runtime-config.json`; its container SHALL write the file at start from its environment and SHALL refuse to start when a value is missing.

#### Scenario: The admin container writes its configuration at start
- **WHEN** the `admin` container starts with the four configuration variables set
- **THEN** `/runtime-config.json` returns them, and the image itself holds no such file

#### Scenario: A missing value stops the admin container
- **WHEN** the `admin` container starts without its client id
- **THEN** it exits with an error naming the missing variable
