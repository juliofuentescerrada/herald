using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Shouldly;

namespace Herald.Architecture.Tests;

public class PersistenceTests
{
    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void A_module_keeps_its_tables_in_its_own_schema(string module)
    {
        using var context = DesignTimeContextOf(module);

        context.Model.GetDefaultSchema().ShouldBe(module.ToLowerInvariant());
        SchemaRules.TablesOutsideTheModuleSchema(context, module.ToLowerInvariant()).ShouldBeEmpty();
    }

    // The same factory the EF Core tools use, so the checked model is the one migrations are built from.
    private static DbContext DesignTimeContextOf(string module)
    {
        var factory = Modules.Load(module).GetType($"Herald.{module}.Persistence.{module}DesignTimeFactory")
            .ShouldNotBeNull($"{module} has no design-time factory");
        var create = factory.GetInterfaces().Single(type => type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IDesignTimeDbContextFactory<>))
            .GetMethod(nameof(IDesignTimeDbContextFactory<DbContext>.CreateDbContext))!;
        return (DbContext)create.Invoke(Activator.CreateInstance(factory), [Array.Empty<string>()])!;
    }
}
