# Architecture tests

They enforce the `module-boundaries` spec. Each kind of check proves something different, and nothing more:

- **Namespace and type checks** (`SliceRules`, NetArchTest over compiled assemblies): no type depends on a forbidden type. They see only dependencies that compiled code actually uses: a domain type outside `System`, its own domain and `Herald.BuildingBlocks`; a feature using another feature, nested namespaces included; persistence using a feature; a module using another module's types.
- **Project checks** (`ProjectReferences`, reading the `.csproj` files): which Herald projects a project references, used or not. The compiler drops unused references from assemblies, so only the project files show a forbidden reference that no type uses yet.
- **Schema checks** (`SchemaRules`, over each module's EF Core model from its design-time factory): every table a module maps is in its own schema, and only Wolverine's envelopes are in the shared `wolverine` schema. They read the model, not the database: they say nothing about raw SQL, cross-schema queries or row-level organisation isolation, which are checked against PostgreSQL where persistence is tested.

`FixtureTests` runs the same rules against `Fixtures/`: one module shape every rule accepts, and one violation per rule, so a rule that silently stops matching fails a test.
