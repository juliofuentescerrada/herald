using NetArchTest.Rules;
using Shouldly;

namespace Herald.Architecture.Tests;

public class ModuleTests
{
    private static readonly string[] _infrastructure = ["Wolverine", "Microsoft.EntityFrameworkCore", "Npgsql", "Microsoft.AspNetCore"];

    [Fact]
    public void Every_listed_module_is_found_and_has_its_entry_point()
    {
        foreach (var module in Modules.Names)
        {
            var assembly = Modules.Load(module);
            assembly.GetType($"Herald.{module}.Adapters.{module}Module").ShouldNotBeNull($"{module} has no entry point");
        }
    }

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void A_module_does_not_depend_on_another_module(string module)
    {
        var others = Modules.Names.Where(other => other != module).Select(other => $"Herald.{other}.").ToArray();

        Types.InAssembly(Modules.Load(module)).ShouldNot().HaveDependencyOnAny(others).GetResult().ShouldHaveNoFailingTypes();
    }

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void A_module_references_no_Herald_project_but_the_building_blocks_and_the_contracts(string module)
    {
        Modules.Load(module).GetReferencedAssemblies()
            .Select(reference => reference.Name)
            .Where(name => name!.StartsWith("Herald.", StringComparison.Ordinal))
            .ShouldBeSubsetOf(["Herald.BuildingBlocks", "Herald.Contracts"]);
    }

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void The_domain_depends_only_on_the_building_blocks(string module)
    {
        string[] forbidden = ["Herald.Contracts", $"Herald.{module}.Application", $"Herald.{module}.Adapters", .. _infrastructure];

        Types.InAssembly(Modules.Load(module))
            .That().ResideInNamespace($"Herald.{module}.Domain")
            .ShouldNot().HaveDependencyOnAny(forbidden)
            .GetResult().ShouldHaveNoFailingTypes();
    }

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void The_application_layer_does_not_depend_on_adapters(string module)
    {
        Types.InAssembly(Modules.Load(module))
            .That().ResideInNamespace($"Herald.{module}.Application")
            .ShouldNot().HaveDependencyOnAny($"Herald.{module}.Adapters")
            .GetResult().ShouldHaveNoFailingTypes();
    }
}
