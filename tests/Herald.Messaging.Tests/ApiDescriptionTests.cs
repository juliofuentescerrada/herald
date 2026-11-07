using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Shouldly;

namespace Herald.Messaging.Tests;

[Collection(PostgresTests.Name)]
public sealed class ApiDescriptionTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_modules_Wolverine_endpoint_appears_in_the_OpenAPI_document_with_its_route_method_and_response_type()
    {
        await using var host = await ProbeHost.StartAsync(await postgres.CreateDatabaseAsync());

        using var document = JsonDocument.Parse(await host.GetTestClient().GetStringAsync("/openapi/v1.json", TestContext.Current.CancellationToken));

        var operation = document.RootElement.GetProperty("paths").GetProperty("/probe/receipts/{recordId}").GetProperty("get");
        operation.GetProperty("responses").GetProperty("200").GetProperty("content").GetProperty("application/json")
            .GetProperty("schema").GetProperty("$ref").GetString().ShouldBe("#/components/schemas/ReceiptCount");
    }
}
