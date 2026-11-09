using Herald.ModuleHosting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        var endpoints = host.Services.GetRequiredService<EndpointDataSource>().Endpoints;
        var unprotected = endpoints.Where(IsUnprotectedAdmin).Select(endpoint => endpoint.DisplayName);

        // Not vacuous: the admin endpoints are there to check.
        endpoints.OfType<RouteEndpoint>().Select(endpoint => endpoint.RoutePattern.RawText).ShouldContain("/api/me");
        unprotected.ShouldBeEmpty("Admin endpoints take the organiser policy from MapHeraldApi; do not allow anonymous access.");
    }

    [Fact]
    public void The_admin_policy_check_catches_an_admin_endpoint_that_allows_anonymous_access()
    {
        var anonymous = new Endpoint(_ => Task.CompletedTask, new EndpointMetadataCollection(
            new EndpointGroupNameAttribute(HeraldApi.Admin),
            new AuthorizeAttribute(HeraldAuthentication.OrganiserPolicy),
            new AllowAnonymousAttribute()), "anonymous admin endpoint");

        IsUnprotectedAdmin(anonymous).ShouldBeTrue();
    }

    private static bool IsUnprotectedAdmin(Endpoint endpoint) =>
        endpoint.Metadata.GetMetadata<IEndpointGroupNameMetadata>()?.EndpointGroupName == HeraldApi.Admin
        && (endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null
            || !endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Any(data => data.Policy == HeraldAuthentication.OrganiserPolicy));

    [Fact]
    public void The_host_does_not_start_without_its_sign_in_configuration()
    {
        using var host = new HostFactory(postgres.ConnectionString).WithWebHostBuilder(builder =>
            builder.UseSetting("Herald:Authentication:Authority", ""));

        Should.Throw<OptionsValidationException>(() => host.Server).Message.ShouldContain("Herald:Authentication:Authority");
    }
}
