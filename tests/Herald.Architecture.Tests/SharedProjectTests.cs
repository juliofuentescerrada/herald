using Shouldly;

namespace Herald.Architecture.Tests;

public class SharedProjectTests
{
    [Fact]
    public void The_building_blocks_reference_no_other_Herald_project() =>
        ProjectReferences.Of("Herald.BuildingBlocks").ShouldBeEmpty();

    [Fact]
    public void The_contracts_reference_no_Herald_project_but_the_building_blocks() =>
        ProjectReferences.Of("Herald.Contracts").ShouldBeSubsetOf(["Herald.BuildingBlocks"]);

    [Fact]
    public void Module_hosting_references_no_module_and_not_the_host() =>
        ProjectReferences.Of("Herald.ModuleHosting")
            .Intersect([.. Modules.Names.Select(module => $"Herald.{module}"), "Herald.Host"])
            .ShouldBeEmpty();
}
