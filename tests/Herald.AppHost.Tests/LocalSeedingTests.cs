using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;
using Aspire.Hosting.Testing;
using Shouldly;

namespace Herald.AppHost.Tests;

// The local-environment spec's seeding, read from the AppHost's model without starting it.
public class LocalSeedingTests
{
    private const string DirectoryId = "0198f5ee-0000-7000-8000-0000000000d1";
    private const string ObjectId = "0198f5ee-0000-7000-8000-00000000a001";

    private static readonly string[] _signIn =
    [
        $"--Parameters:auth-authority=https://herald-test.ciamlogin.com/{DirectoryId}",
        "--Parameters:auth-api-audience=herald-api",
        "--Parameters:auth-api-scope=api://herald-api/access_as_user",
        "--Parameters:auth-admin-client-id=herald-admin",
    ];

    private static async Task<ProjectResource> SeedAsync(params string[] args)
    {
        var builder = await DistributedApplicationTestingBuilder.CreateAsync<Projects.Herald_AppHost>([.. _signIn, .. args], TestContext.Current.CancellationToken);
        return builder.Resources.OfType<ProjectResource>().Single(resource => resource.Name == "seed");
    }

    private static async Task<Dictionary<string, string?>> PersonaVariablesAsync(ProjectResource seed)
    {
        var context = new EnvironmentCallbackContext(new DistributedApplicationExecutionContext(DistributedApplicationOperation.Publish));
        foreach (var callback in seed.Annotations.OfType<EnvironmentCallbackAnnotation>())
        {
            await callback.Callback(context);
        }

        return context.EnvironmentVariables
            .Where(variable => variable.Key.StartsWith("Herald__Seed__", StringComparison.Ordinal))
            .ToDictionary(variable => variable.Key, variable => variable.Value?.ToString());
    }

    [Fact]
    [Trait("covers", "local-environment: Starting the AppHost with personas configured")]
    public async Task With_the_maintainers_object_id_the_seeding_waits_for_the_host_and_seeds_as_them()
    {
        var seed = await SeedAsync($"--Parameters:seed-object-id={ObjectId}");

        seed.Annotations.OfType<WaitAnnotation>().Select(wait => wait.Resource.Name).ShouldContain("host");
        (await PersonaVariablesAsync(seed)).ShouldBe(new Dictionary<string, string?>
        {
            ["Herald__Seed__Personas__Main__DirectoryId"] = DirectoryId,
            ["Herald__Seed__Personas__Main__ObjectId"] = ObjectId,
        }, ignoreOrder: true);
    }

    [Fact]
    [Trait("covers", "local-environment: Starting the AppHost without personas")]
    public async Task Without_an_object_id_the_seeding_resource_has_no_persona_and_reports_itself_skipped()
    {
        var seed = await SeedAsync();

        (await PersonaVariablesAsync(seed)).ShouldBeEmpty();
    }
}
