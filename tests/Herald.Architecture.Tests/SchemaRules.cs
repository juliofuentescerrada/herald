using Microsoft.EntityFrameworkCore;

namespace Herald.Architecture.Tests;

// Reads a module's EF Core model: every table it maps is in the module's schema, except Wolverine's
// envelopes, which belong to the shared message store (ADR 0008).
internal static class SchemaRules
{
    private const string MessageStoreSchema = "wolverine";

    public static string[] TablesOutsideTheModuleSchema(DbContext context, string schema) =>
        [.. context.Model.GetEntityTypes()
            .Where(entity => entity.GetTableName() is not null)
            .Where(entity => entity.GetSchema() != (IsEnvelope(entity.ClrType) ? MessageStoreSchema : schema))
            .Select(entity => $"{entity.ClrType.Name} in schema '{entity.GetSchema()}'")];

    private static bool IsEnvelope(Type type) => type.Namespace?.StartsWith("Wolverine", StringComparison.Ordinal) == true;
}
