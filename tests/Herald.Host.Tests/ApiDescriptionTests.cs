using System.Net;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class ApiDescriptionTests(PostgresFixture postgres)
{
    [Fact]
    public async Task The_host_serves_its_OpenAPI_document_in_Development()
    {
        await using var host = new HostFactory(postgres.ConnectionString);

        var response = await host.CreateClient().GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)).ShouldContain("\"openapi\"");
    }
}
