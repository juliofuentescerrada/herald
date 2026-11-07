using NetArchTest.Rules;
using Shouldly;

namespace Herald.Architecture.Tests;

public class ModuleTests
{
    private static readonly string[] _permittedProjects = ["Herald.BuildingBlocks", "Herald.Contracts", "Herald.ModuleHosting"];

    [Fact]
    public void Every_listed_module_is_found_and_has_its_entry_point_at_its_root()
    {
        foreach (var module in Modules.Names)
        {
            var assembly = Modules.Load(module);
            assembly.GetType($"Herald.{module}.{module}Module").ShouldNotBeNull($"{module} has no entry point at its root");
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
    public void A_module_references_no_Herald_project_but_the_building_blocks_the_contracts_and_module_hosting(string module) =>
        ProjectReferences.Of($"Herald.{module}").ShouldBeSubsetOf(_permittedProjects);

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void The_domain_depends_only_on_the_building_blocks(string module) =>
        SliceRules.DomainDependsOnlyOnTheBuildingBlocks(Modules.Load(module), $"Herald.{module}").ShouldHaveNoFailingTypes();

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void Features_do_not_depend_on_each_other(string module)
    {
        foreach (var result in SliceRules.FeaturesAreIndependent(Modules.Load(module), $"Herald.{module}"))
        {
            result.ShouldHaveNoFailingTypes();
        }
    }

    [Theory]
    [MemberData(nameof(Modules.All), MemberType = typeof(Modules))]
    public void Persistence_does_not_depend_on_features(string module) =>
        SliceRules.PersistenceDoesNotDependOnFeatures(Modules.Load(module), $"Herald.{module}").ShouldHaveNoFailingTypes();
}
