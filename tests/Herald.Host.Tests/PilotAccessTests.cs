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

    private sealed record GrantView(
        Guid Id, string Name, Guid ApplicationId, Guid[]? Tournaments, string[] Groups, string GrantedBy, DateTimeOffset GrantedAt,
        string? RevokedBy, DateTimeOffset? RevokedAt);

    private async Task<(HttpClient Owner, Guid Organisation)> OrganisationAsync()
    {
        var owner = api.As(Guid.NewGuid(), "Alex Morgan");
        var organisation = Guid.NewGuid();
        (await owner.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        return (owner, organisation);
    }

    private static Task<HttpResponseMessage> GrantAsync(
        HttpClient owner, Guid organisation, Guid grant, Guid application, Guid[]? tournaments, params string[] groups) =>
        owner.PutAsJsonAsync($"/api/organisations/{organisation}/applications/{grant}",
            new { name = "Results bot", applicationId = application, tournaments, groups }, Cancellation);

    private static async Task<GrantView> ReadAsync(HttpResponseMessage response)
    {
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<GrantView>(Cancellation))!;
    }

    [Fact]
    [Trait("covers", "pilot-access: Granting results for one tournament")]
    public async Task An_owner_grants_an_application_results_for_one_tournament_and_sees_it_listed_as_active()
    {
        var (owner, organisation) = await OrganisationAsync();
        var (grant, application, saturdayOpen) = (Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var granted = await ReadAsync(await GrantAsync(owner, organisation, grant, application, [saturdayOpen], "results", "read"));

        granted.ShouldSatisfyAllConditions(
            g => g.Id.ShouldBe(grant),
            g => g.ApplicationId.ShouldBe(application),
            g => g.Tournaments.ShouldBe([saturdayOpen]),
            g => g.Groups.ShouldBe(["read", "results"]),
            g => g.GrantedBy.ShouldBe("Alex Morgan"),
            g => g.RevokedAt.ShouldBeNull());
        (await owner.GetFromJsonAsync<GrantView[]>($"/api/organisations/{organisation}/applications", Cancellation))
            .ShouldHaveSingleItem().ShouldBeEquivalentTo(granted);
    }

    [Fact]
    [Trait("covers", "pilot-access: Revoking")]
    public async Task A_revoked_grant_is_listed_with_the_owner_and_the_time_and_the_application_loses_access_at_once()
    {
        var (owner, organisation) = await OrganisationAsync();
        var (grant, application) = (Guid.NewGuid(), Guid.NewGuid());
        await GrantAsync(owner, organisation, grant, application, null, "read");
        var bot = api.AsApplication(application);
        (await bot.GetAsync($"/api/organisations/{organisation}", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var revoked = await ReadAsync(await owner.PostAsync($"/api/organisations/{organisation}/applications/{grant}/revocation", null, Cancellation));

        revoked.RevokedBy.ShouldBe("Alex Morgan");
        revoked.RevokedAt.ShouldNotBeNull();
        (await bot.GetAsync($"/api/organisations/{organisation}", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Repeating_a_grant_returns_it_and_a_second_active_grant_for_the_application_conflicts()
    {
        var (owner, organisation) = await OrganisationAsync();
        var (grant, application) = (Guid.NewGuid(), Guid.NewGuid());
        var first = await ReadAsync(await GrantAsync(owner, organisation, grant, application, null, "read"));

        (await ReadAsync(await GrantAsync(owner, organisation, grant, application, null, "read"))).ShouldBeEquivalentTo(first);
        var second = await GrantAsync(owner, organisation, Guid.NewGuid(), application, null, "results");

        second.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ProblemTypeAsync(second)).ShouldBe("application-already-granted");
    }

    [Fact]
    public async Task After_revocation_the_application_can_be_granted_again_and_both_grants_are_kept()
    {
        var (owner, organisation) = await OrganisationAsync();
        var (grant, application) = (Guid.NewGuid(), Guid.NewGuid());
        await GrantAsync(owner, organisation, grant, application, null, "read");
        await owner.PostAsync($"/api/organisations/{organisation}/applications/{grant}/revocation", null, Cancellation);

        await ReadAsync(await GrantAsync(owner, organisation, Guid.NewGuid(), application, null, "read", "results"));

        (await owner.GetFromJsonAsync<GrantView[]>($"/api/organisations/{organisation}/applications", Cancellation))!
            .Select(g => g.RevokedAt is null).ShouldBe([true, false]);
    }

    [Fact]
    public async Task A_grant_without_a_name_an_application_or_operations_names_each_field()
    {
        var (owner, organisation) = await OrganisationAsync();

        var response = await owner.PutAsJsonAsync($"/api/organisations/{organisation}/applications/{Guid.NewGuid()}",
            new { name = " ", tournaments = Array.Empty<Guid>(), groups = Array.Empty<string>() }, Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation)).GetProperty("errors");
        errors.EnumerateObject().Select(field => field.Name).Order().ShouldBe(["applicationId", "groups", "name", "tournaments"]);
    }

    [Fact]
    public async Task Another_organisations_grants_are_not_visible()
    {
        var (owner, organisation) = await OrganisationAsync();
        var grant = Guid.NewGuid();
        await GrantAsync(owner, organisation, grant, Guid.NewGuid(), null, "read");
        var (other, otherOrganisation) = await OrganisationAsync();

        (await other.GetFromJsonAsync<GrantView[]>($"/api/organisations/{otherOrganisation}/applications", Cancellation)).ShouldBeEmpty();
        (await other.PostAsync($"/api/organisations/{otherOrganisation}/applications/{grant}/revocation", null, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

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
