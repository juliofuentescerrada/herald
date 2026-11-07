# module-boundaries Specification

> Implementation status: implemented by [m0-messaging](../../changes/archive/2026-11-07-m0-messaging/proposal.md): modules are vertical slices following [ADR 0004](../../../docs/adr/0004-modular-monolith-with-vertical-slices.md).

## Purpose
The dependency rules between modules, layers and the shared projects (ADR 0004), enforced by architecture tests over one module list that evolves with the design.
## Requirements
### Requirement: Modules are independent of each other
The solution SHALL declare its modules in one list in the architecture tests, initially `Herald.Organisations`, `Herald.Tournaments`, `Herald.Registration`, `Herald.Competition` and `Herald.Standings`, and no module SHALL reference another module, by project reference or by type. Modules MAY reference only `Herald.BuildingBlocks`, `Herald.Contracts` and `Herald.ModuleHosting` among Herald's projects. Each module SHALL have its entry point at its root, in the namespace `Herald.<Module>`.

#### Scenario: A module referencing another module fails the build checks
- **WHEN** a type in one module depends on a type in another module
- **THEN** the architecture tests fail and name the offending dependency

#### Scenario: Every module is checked
- **WHEN** the architecture tests run
- **THEN** they check every module in the list, and fail if a listed module assembly cannot be found or has no entry point at its root

### Requirement: The domain depends only on the building blocks
Types in a module's `Domain` namespace SHALL depend only on their own domain, framework-independent .NET base-library types and `Herald.BuildingBlocks`. They SHALL NOT depend on application or infrastructure concerns, including the module's composition root, `Features` or `Persistence`, `Herald.Contracts`, `Herald.ModuleHosting`, Wolverine, EF Core, Npgsql or ASP.NET Core. These exclusions are examples, not an exhaustive library blacklist.

#### Scenario: A domain type using an infrastructure library fails the checks
- **WHEN** a type under `<Module>.Domain` depends on a type from Wolverine, EF Core, Npgsql, ASP.NET Core, `Herald.Contracts` or `Herald.ModuleHosting`
- **THEN** the architecture tests fail and name the offending type

#### Scenario: An unlisted technical dependency cannot bypass domain purity
- **WHEN** a domain type depends on module composition or a technical library outside its permitted dependencies
- **THEN** the architecture check fails even if the library is not named in the illustrative exclusions

### Requirement: Shared projects stay below the modules
`Herald.BuildingBlocks` SHALL reference no other Herald project, `Herald.Contracts` SHALL reference no Herald project other than `Herald.BuildingBlocks`, and `Herald.ModuleHosting` SHALL reference no module and not the host.

#### Scenario: A shared project referencing a module fails the checks
- **WHEN** `Herald.BuildingBlocks`, `Herald.Contracts` or `Herald.ModuleHosting` depends on a module or on the host
- **THEN** the architecture tests fail

### Requirement: Features are independent of each other
A module's use cases SHALL be vertical slices, each in its own namespace under `<Module>.Features` (`<Module>.Features.<Feature>`, one file or a cohesive folder). A feature SHALL NOT depend on another feature of the same module, including its request or handler types. Shared business concepts and invariants SHALL belong in `Domain`; shared technical concerns SHALL remain with their responsibility, with explicit permitted dependencies, rather than being placed in `Domain` merely because two features use them. Features MAY use their module's domain and persistence; persistence SHALL NOT depend on features. Module composition SHALL contain no business workflow.

#### Scenario: A feature using another feature fails the checks
- **WHEN** a type in `<Module>.Features.<A>` depends on a type in `<Module>.Features.<B>`
- **THEN** the architecture tests fail and name both types

#### Scenario: Persistence cannot invoke a feature
- **WHEN** a type in `<Module>.Persistence` depends on a type in `<Module>.Features`
- **THEN** the architecture tests fail and name the offending dependency

### Requirement: Boundary checks prove their scope
Architecture checks SHALL include positive examples and representative failing fixtures for the rules they enforce. Project-reference checks SHALL detect an unused forbidden project reference independently of type usage. Namespace checks SHALL detect forbidden type dependencies in nested feature namespaces. Database ownership SHALL be checked separately when persistence is introduced; a passing type check SHALL NOT be presented as proof of schema or row-level organisation isolation.

#### Scenario: An unused cross-module project reference is rejected
- **WHEN** a module project references another module without using any of its types
- **THEN** project-reference validation fails and identifies both projects

#### Scenario: A nested feature cannot bypass the dependency rule
- **WHEN** a type nested below `<Module>.Features.<A>` uses a type nested below `<Module>.Features.<B>`
- **THEN** the architecture check fails and its fixture demonstrates that the rule covers nested namespaces

#### Scenario: A permitted slice dependency passes
- **WHEN** a feature depends only on its own domain and persistence and permitted shared technical projects
- **THEN** the boundary checks accept that dependency graph

