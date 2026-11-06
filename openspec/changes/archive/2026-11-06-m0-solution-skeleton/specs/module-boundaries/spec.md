## ADDED Requirements

### Requirement: Modules are independent of each other
The solution SHALL declare its modules in one list in the architecture tests, initially `Herald.Organisations`, `Herald.Tournaments`, `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, and no module SHALL reference another module, by project reference or by type. Modules MAY reference only `Herald.BuildingBlocks` and `Herald.Contracts` among Herald's projects.

#### Scenario: A module referencing another module fails the build checks
- **WHEN** a type in one module depends on a type in another module
- **THEN** the architecture tests fail and name the offending dependency

#### Scenario: Every module is checked
- **WHEN** the architecture tests run
- **THEN** they check every module in the list, and fail if a listed module assembly cannot be found

### Requirement: The domain depends only on the building blocks
Types in a module's `Domain` namespace SHALL NOT depend on `Herald.Contracts`, on the module's `Application` or `Adapters` namespaces, or on Wolverine, EF Core, Npgsql or ASP.NET Core.

#### Scenario: A domain type using an infrastructure library fails the checks
- **WHEN** a type under `<Module>.Domain` depends on a type from Wolverine, EF Core, Npgsql, ASP.NET Core or `Herald.Contracts`
- **THEN** the architecture tests fail and name the offending type

### Requirement: The application layer does not depend on adapters
Types in a module's `Application` namespace SHALL NOT depend on types in the same module's `Adapters` namespace.

#### Scenario: An application type using an adapter fails the checks
- **WHEN** a type under `<Module>.Application` depends on a type under `<Module>.Adapters`
- **THEN** the architecture tests fail and name the offending type

### Requirement: Shared projects stay below the modules
`Herald.BuildingBlocks` SHALL reference no other Herald project, and `Herald.Contracts` SHALL reference no Herald project other than `Herald.BuildingBlocks`.

#### Scenario: A shared project referencing a module fails the checks
- **WHEN** `Herald.BuildingBlocks` or `Herald.Contracts` depends on a module or on the host
- **THEN** the architecture tests fail
