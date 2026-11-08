using System.Net;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class ApiDescriptionTests(PostgresFixture postgres)
{
    [Theory]
    [InlineData(HeraldApi.Public)]
    [InlineData(HeraldApi.Admin)]
    public async Task The_host_serves_each_OpenAPI_document_in_Development(string document)
    {
        await using var host = new HostFactory(postgres.ConnectionString);

        var response = await host.CreateClient().GetAsync($"/openapi/{document}.json", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldContain("\"openapi\"");
    }

    [Fact]
    public async Task Every_endpoint_of_the_host_belongs_to_exactly_one_OpenAPI_document_and_names_its_operation()
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        _ = host.Server;

        var incomplete = host.Services.GetRequiredService<IApiDescriptionGroupCollectionProvider>().ApiDescriptionGroups.Items
            .SelectMany(group => group.Items)
            .Select(description => (description, operation: OperationOf(description)))
            .Where(endpoint => !HeraldApi.Documents.Contains(endpoint.description.GroupName) || endpoint.operation is null)
            .Select(endpoint => $"{endpoint.description.HttpMethod} /{endpoint.description.RelativePath} " +
                $"(group: {endpoint.description.GroupName ?? "none"}, operation: {endpoint.operation ?? "none"})");

        // The operation becomes the generated client's method name; Wolverine's default reads like `gETApiPublicThingsId`.
        incomplete.ShouldBeEmpty("Declare [EndpointGroupName(HeraldApi.Public or HeraldApi.Admin)] and [EndpointName(\"camelCaseOperation\")] on each endpoint.");
    }

    // Only the attribute counts: Wolverine names every endpoint itself (`GET_api_things_id`).
    private static string? OperationOf(ApiDescription description) =>
        description.ActionDescriptor.EndpointMetadata.OfType<EndpointNameAttribute>().LastOrDefault()?.EndpointName;
}
