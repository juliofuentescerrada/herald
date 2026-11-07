using JasperFx.CodeGeneration;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Wolverine.Runtime;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class GeneratedCodeTests(PostgresFixture postgres)
{
    [Fact]
    public async Task The_host_starts_in_Production_on_the_committed_generated_code()
    {
        await using var host = new HostFactory(postgres.ConnectionString, environment: "Production");

        _ = host.CreateClient();

        var codeGeneration = host.Services.GetRequiredService<IWolverineRuntime>().Options.CodeGeneration;
        codeGeneration.TypeLoadMode.ShouldBe(TypeLoadMode.Static);
        codeGeneration.ApplicationAssembly.ShouldBe(typeof(Program).Assembly);
        typeof(Program).Assembly.GetType("Internal.Generated.WolverineHandlers.GeneratedHandlerRegistry").ShouldNotBeNull();
    }

    [Fact]
    public async Task The_host_generates_its_code_at_run_time_in_Development()
    {
        await using var host = new HostFactory(postgres.ConnectionString);

        _ = host.CreateClient();

        host.Services.GetRequiredService<IWolverineRuntime>().Options.CodeGeneration.TypeLoadMode.ShouldBe(TypeLoadMode.Dynamic);
    }
}
