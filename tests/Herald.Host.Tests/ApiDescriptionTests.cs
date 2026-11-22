using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
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

    // The identifier review (h1-api-journey D-3, API-06): what each identifier identifies, entries on pairings and results, the entry
    // kind on tournaments and fields, nothing team-only in an individual request, and each operation's business errors.
    [Fact]
    [Trait("covers", "api-description: A result request")]
    public async Task The_admin_description_names_identifiers_for_what_they_identify_and_lists_business_errors()
    {
        await using var host = new HostFactory(postgres.ConnectionString);
        using var document = JsonDocument.Parse(await host.CreateClient().GetStringAsync($"/openapi/{HeraldApi.Admin}.json", TestContext.Current.CancellationToken));
        var schemas = document.RootElement.GetProperty("components").GetProperty("schemas");
        var properties = schemas.EnumerateObject()
            .SelectMany(schema => schema.Value.TryGetProperty("properties", out var found)
                ? found.EnumerateObject().Select(property => (Schema: schema.Name, Property: property.Name))
                : [])
            .ToList();
        var operations = document.RootElement.GetProperty("paths").EnumerateObject()
            .SelectMany(path => path.Value.EnumerateObject().Select(operation => (Path: path.Name, Method: operation.Name, Operation: operation.Value)))
            .ToList();

        properties.Where(p => p.Property == "id" && !Regex.IsMatch(p.Schema, "Tournament|Entry|Guest|Grant|Organisation"))
            .ShouldBeEmpty("An `id` belongs to a schema that names what it identifies; elsewhere name it (`entryId`, `matchId`).");
        properties.Where(p => p.Property == "playerId" && Regex.IsMatch(p.Schema, "Match|Pairing|Result|Entrant|Standings|Side|Competitor"))
            .ShouldBeEmpty("Pairings and results reference entries; `playerId` is a guest player's only.");
        operations.Where(o => !Regex.IsMatch(o.Path, "roster|lineups") && RequestSchema(o.Operation) is { } request
                && Required(schemas.GetProperty(request)).Any(name => Regex.IsMatch(name, "roster|lineup|team|activePlayers", RegexOptions.IgnoreCase)))
            .Select(o => o.Operation.GetProperty("operationId").GetString()).ShouldBeEmpty("An individual operation requires nothing team-only.");
        Property(schemas, "TournamentDetails", "configuration", "entryKind").ShouldBeTrue();
        Property(schemas, "TournamentSummary", "entryKind").ShouldBeTrue();
        Property(schemas, "FieldDetails", "terms", "entryKind").ShouldBeTrue();
        operations.Where(o => o.Method != "get" && o.Path.StartsWith("/api/organisations/{organisationId}", StringComparison.Ordinal)
                && !ProblemTypes(o.Operation, "409").Contains(Receipts.OperationReused))
            .Select(o => o.Operation.GetProperty("operationId").GetString()).ShouldBeEmpty("Every mutation lists its conflicts, `operation-reused` among them.");

        var result = operations.Single(o => o.Operation.GetProperty("operationId").GetString() == "recordResult");
        result.Path.ShouldContain("{matchId}");
        Property(schemas, "MatchView", "first", "entrant", "entryId").ShouldBeTrue();
        ProblemTypes(result.Operation, "409").ShouldBe(["match-revision-conflict", Receipts.OperationReused]);
        ProblemTypes(result.Operation, "403").ShouldBe([HeraldApi.OperationNotGranted]);
        ProblemTypes(result.Operation, "404").ShouldBe([HeraldApi.OrganisationNotAvailable]);
    }

    private static string? RequestSchema(JsonElement operation) =>
        operation.TryGetProperty("requestBody", out var body) && body.GetProperty("content").TryGetProperty("application/json", out var json)
        && json.GetProperty("schema").TryGetProperty("$ref", out var reference)
            ? reference.GetString()![(reference.GetString()!.LastIndexOf('/') + 1)..]
            : null;

    private static IEnumerable<string> Required(JsonElement schema) =>
        schema.TryGetProperty("required", out var required) ? required.EnumerateArray().Select(name => name.GetString()!) : [];

    private static string[] ProblemTypes(JsonElement operation, string status) =>
        operation.GetProperty("responses").TryGetProperty(status, out var response) && response.TryGetProperty("x-problem-types", out var types)
            ? [.. types.EnumerateArray().Select(type => type.GetString()!)]
            : [];

    // Whether the schema reaches the property through the named properties, following references.
    private static bool Property(JsonElement schemas, string schema, params string[] path)
    {
        var current = schemas.GetProperty(schema);
        foreach (var name in path)
        {
            if (!current.TryGetProperty("properties", out var found) || !found.TryGetProperty(name, out current))
            {
                return false;
            }

            if (Reference(current) is { } reference)
            {
                current = schemas.GetProperty(reference);
            }
        }

        return true;
    }

    private static string? Reference(JsonElement schema)
    {
        if (schema.TryGetProperty("$ref", out var direct))
        {
            return direct.GetString()![(direct.GetString()!.LastIndexOf('/') + 1)..];
        }

        // A nullable reference is a union with null.
        foreach (var union in new[] { "oneOf", "anyOf" })
        {
            if (schema.TryGetProperty(union, out var options)
                && options.EnumerateArray().FirstOrDefault(option => option.TryGetProperty("$ref", out _)) is { ValueKind: JsonValueKind.Object } option)
            {
                return Reference(option);
            }
        }

        return null;
    }

    // Only the attribute counts: Wolverine names every endpoint itself (`GET_api_things_id`).
    private static string? OperationOf(ApiDescription description) =>
        description.ActionDescriptor.EndpointMetadata.OfType<EndpointNameAttribute>().LastOrDefault()?.EndpointName;
}
