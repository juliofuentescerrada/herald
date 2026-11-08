using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Shouldly;

namespace Herald.Messaging.Tests;

[Collection(PostgresTests.Name)]
public sealed class ApiDescriptionTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_modules_public_Wolverine_endpoint_appears_in_the_public_document_with_its_route_method_and_response_type_and_not_in_the_admin_one()
    {
        await using var host = await ProbeHost.StartAsync(await postgres.CreateDatabaseAsync());
        var client = host.GetTestClient();

        using var publicDocument = JsonDocument.Parse(await client.GetStringAsync("/openapi/public.json", TestContext.Current.CancellationToken));
        using var adminDocument = JsonDocument.Parse(await client.GetStringAsync("/openapi/admin.json", TestContext.Current.CancellationToken));

        var operation = publicDocument.RootElement.GetProperty("paths").GetProperty("/probe/receipts/{recordId}").GetProperty("get");
        operation.GetProperty("responses").GetProperty("200").GetProperty("content").GetProperty("application/json")
            .GetProperty("schema").GetProperty("$ref").GetString().ShouldBe("#/components/schemas/ReceiptCount");
        adminDocument.RootElement.TryGetProperty("paths", out var adminPaths).ShouldBeTrue();
        adminPaths.TryGetProperty("/probe/receipts/{recordId}", out _).ShouldBeFalse();
    }
}
