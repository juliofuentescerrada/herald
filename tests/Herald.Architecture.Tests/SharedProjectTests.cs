using System.Reflection;
using Shouldly;

namespace Herald.Architecture.Tests;

public class SharedProjectTests
{
    [Fact]
    public void The_building_blocks_reference_no_other_Herald_project() =>
        HeraldReferencesOf("Herald.BuildingBlocks").ShouldBeEmpty();

    [Fact]
    public void The_contracts_reference_no_Herald_project_but_the_building_blocks() =>
        HeraldReferencesOf("Herald.Contracts").ShouldBeSubsetOf(["Herald.BuildingBlocks"]);

    private static string[] HeraldReferencesOf(string assembly) =>
        [.. Assembly.Load(assembly).GetReferencedAssemblies()
            .Select(reference => reference.Name!)
            .Where(name => name.StartsWith("Herald.", StringComparison.Ordinal))];
}
