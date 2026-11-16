using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.ModuleHosting;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(OrganisationApiTests.Name)]
public class PilotAccessTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static async Task<string?> ProblemTypeAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation)).GetProperty("type").GetString();

    [Fact]
    [Trait("covers", "organisation-isolation: An application creates an organisation")]
    public async Task An_application_cannot_create_an_organisation()
    {
        var response = await api.AsApplication(Guid.NewGuid()).CreateAsync(Guid.NewGuid(), "Bot Gaming");

        response.StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await ProblemTypeAsync(response)).ShouldBe(HeraldApi.OperationNotGranted);
    }

    [Fact]
    public async Task An_application_has_no_details_of_its_own() =>
        (await api.AsApplication(Guid.NewGuid()).GetAsync("/api/me", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);

    [Fact]
    public async Task An_application_without_a_grant_sees_the_generic_denial()
    {
        var organisation = Guid.NewGuid();
        await api.As(Guid.NewGuid()).CreateAsync(organisation, "Northside Gaming");

        var response = await api.AsApplication(Guid.NewGuid()).GetAsync($"/api/organisations/{organisation}", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ProblemTypeAsync(response)).ShouldBe(HeraldApi.OrganisationNotAvailable);
    }
}
