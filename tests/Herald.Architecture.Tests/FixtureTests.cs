using Herald.Architecture.Tests.Fixtures.Schemas;
using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace Herald.Architecture.Tests;

// The rules are proved against fixtures: one module shape they accept and one violation per rule.
public class FixtureTests
{
    private const string Compliant = "Herald.Architecture.Tests.Fixtures.Compliant";
    private const string Violating = "Herald.Architecture.Tests.Fixtures.Violating";
    private static readonly System.Reflection.Assembly _fixtures = typeof(FixtureTests).Assembly;

    [Fact]
    public void A_compliant_module_passes_every_slice_rule()
    {
        SliceRules.DomainDependsOnlyOnTheBuildingBlocks(_fixtures, Compliant).ShouldHaveNoFailingTypes();
        SliceRules.PersistenceDoesNotDependOnFeatures(_fixtures, Compliant).ShouldHaveNoFailingTypes();
        var featureResults = SliceRules.FeaturesAreIndependent(_fixtures, Compliant).ToArray();
        featureResults.Length.ShouldBe(2);
        foreach (var result in featureResults)
        {
            result.ShouldHaveNoFailingTypes();
        }
    }

    [Fact]
    public void A_domain_type_using_an_unlisted_library_fails() =>
        SliceRules.DomainDependsOnlyOnTheBuildingBlocks(_fixtures, Violating).FailingTypeNames()
            .ShouldBe([$"{Violating}.Domain.Scoring.UsesAnUnlistedLibrary"]);

    [Fact]
    public void A_nested_feature_using_another_feature_fails() =>
        SliceRules.FeaturesAreIndependent(_fixtures, Violating).SelectMany(result => result.FailingTypeNames())
            .ShouldBe([$"{Violating}.Features.RecordScore.Nested.UsesAnotherFeature"]);

    [Fact]
    public void Persistence_using_a_feature_fails() =>
        SliceRules.PersistenceDoesNotDependOnFeatures(_fixtures, Violating).FailingTypeNames()
            .ShouldBe([$"{Violating}.Persistence.Stores.UsesAFeature"]);

    [Fact]
    public void An_unused_forbidden_project_reference_is_found()
    {
        var file = Path.Combine(ProjectReferences.RepositoryRoot, "tests", "Herald.Architecture.Tests", "Fixtures", "Projects", "ModuleWithUnusedForbiddenReference.xml");

        ProjectReferences.InFile(file).Except(["Herald.BuildingBlocks", "Herald.Contracts", "Herald.ModuleHosting"]).ShouldBe(["Herald.Standings"]);
    }

    [Fact]
    public void A_module_model_with_its_tables_in_its_schema_passes()
    {
        using var context = new CompliantContext(new DbContextOptionsBuilder<CompliantContext>().UseNpgsql("Host=localhost").Options);

        SchemaRules.TablesOutsideTheModuleSchema(context, "scoring").ShouldBeEmpty();
    }

    [Fact]
    public void A_table_in_another_modules_schema_fails()
    {
        using var context = new ViolatingContext(new DbContextOptionsBuilder<ViolatingContext>().UseNpgsql("Host=localhost").Options);

        SchemaRules.TablesOutsideTheModuleSchema(context, "scoring").ShouldBe(["Score in schema 'standings'"]);
    }
}
