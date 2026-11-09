using Herald.ModuleHosting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class AuthenticationTests(PostgresFixture postgres)
{
    [Fact]
    public async Task Every_admin_endpoint_requires_an_assigned_organiser()
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.Server;

        var unprotected = host.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .Where(endpoint => endpoint.Metadata.GetMetadata<IEndpointGroupNameMetadata>()?.EndpointGroupName == HeraldApi.Admin)
            .Where(endpoint => endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null
                || !endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Any(data => data.Policy == HeraldAuthentication.OrganiserPolicy))
            .Select(endpoint => endpoint.DisplayName);

        unprotected.ShouldBeEmpty("Admin endpoints take the organiser policy from MapHeraldApi; do not allow anonymous access.");
    }

    [Fact]
    public void The_host_does_not_start_without_its_sign_in_configuration()
    {
        using var host = new HostFactory(postgres.ConnectionString).WithWebHostBuilder(builder =>
            builder.UseSetting("Herald:Authentication:Authority", ""));

        Should.Throw<OptionsValidationException>(() => host.Server).Message.ShouldContain("Herald:Authentication:Authority");
    }
}
