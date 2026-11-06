## MODIFIED Requirements

### Requirement: Modules are independent of each other
The solution SHALL declare its modules in one list in the architecture tests, initially `Herald.Organisations`, `Herald.Tournaments`, `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, and no module SHALL reference another module, by project reference or by type. Modules MAY reference only `Herald.BuildingBlocks`, `Herald.Contracts` and `Herald.ModuleHosting` among Herald's projects. Each module SHALL have its entry point at its root, in the namespace `Herald.<Module>`.

#### Scenario: A module referencing another module fails the build checks
- **WHEN** a type in one module depends on a type in another module
- **THEN** the architecture tests fail and name the offending dependency

#### Scenario: Every module is checked
- **WHEN** the architecture tests run
- **THEN** they check every module in the list, and fail if a listed module assembly cannot be found or has no entry point at its root

### Requirement: The domain depends only on the building blocks
Types in a module's `Domain` namespace SHALL NOT depend on `Herald.Contracts`, `Herald.ModuleHosting`, the module's `Features` or `Persistence` namespaces, or on Wolverine, EF Core, Npgsql or ASP.NET Core.

#### Scenario: A domain type using an infrastructure library fails the checks
- **WHEN** a type under `<Module>.Domain` depends on a type from Wolverine, EF Core, Npgsql, ASP.NET Core, `Herald.Contracts` or `Herald.ModuleHosting`
- **THEN** the architecture tests fail and name the offending type

### Requirement: Shared projects stay below the modules
`Herald.BuildingBlocks` SHALL reference no other Herald project, `Herald.Contracts` SHALL reference no Herald project other than `Herald.BuildingBlocks`, and `Herald.ModuleHosting` SHALL reference no module and not the host.

#### Scenario: A shared project referencing a module fails the checks
- **WHEN** `Herald.BuildingBlocks`, `Herald.Contracts` or `Herald.ModuleHosting` depends on a module or on the host
- **THEN** the architecture tests fail

## ADDED Requirements

### Requirement: Features are independent of each other
A module's use cases SHALL be vertical slices, each in its own namespace under `<Module>.Features` (`<Module>.Features.<Feature>`, usually one file), and a feature SHALL NOT depend on another feature of the same module; what two features share belongs in `Domain`.

#### Scenario: A feature using another feature fails the checks
- **WHEN** a type in `<Module>.Features.<A>` depends on a type in `<Module>.Features.<B>`
- **THEN** the architecture tests fail and name both types

## REMOVED Requirements

### Requirement: The application layer does not depend on adapters
**Reason**: Modules are vertical slices (ADR 0004 revised): with Wolverine's endpoints the HTTP entry point and the use case are one method, so there are no `Application` and `Adapters` layers to separate.
**Migration**: The independence of use cases is kept by "Features are independent of each other"; the domain's independence by "The domain depends only on the building blocks".
