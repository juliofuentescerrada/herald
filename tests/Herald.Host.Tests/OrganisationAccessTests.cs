using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(OrganisationApiTests.Name)]
public class OrganisationAccessTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Organisation(Guid Id, string Name);

    private sealed record SignedInPerson(string DisplayName, Organisation[] Organisations);

    private static async Task<SignedInPerson> MeAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<SignedInPerson>("/api/me", Cancellation))!;

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    [Fact]
    public async Task A_request_without_a_token_is_unauthorised() =>
        (await api.Anonymous().GetAsync("/api/me", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

    [Fact]
    public async Task A_token_without_the_organiser_role_is_forbidden() =>
        (await api.As(Guid.NewGuid(), organiser: false).GetAsync("/api/me", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);

    [Theory]
    [InlineData("herald", "11111111-1111-1111-1111-111111111111")]
    [InlineData("00000000-0000-0000-0000-00000000d1ec", "not-an-identifier")]
    public async Task A_token_without_directory_identifiers_is_forbidden_not_an_error(string directoryId, string objectId)
    {
        var client = api.Anonymous();
        client.DefaultRequestHeaders.Authorization = new("Bearer", TestTokens.WithIdentifiers(directoryId, objectId));

        (await client.GetAsync("/api/me", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await client.CreateAsync(Guid.NewGuid(), "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task A_newcomer_has_no_organisations() =>
        (await MeAsync(api.As(Guid.NewGuid()))).Organisations.ShouldBeEmpty();

    [Fact]
    public async Task A_newcomer_creates_an_organisation_and_owns_it()
    {
        var client = api.As(Guid.NewGuid(), "Robin Hale");
        var id = Guid.NewGuid();

        var created = await client.CreateAsync(id, "  Northside Gaming ");

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        (await created.Content.ReadFromJsonAsync<Organisation>(Cancellation)).ShouldBe(new Organisation(id, "Northside Gaming"));
        var me = await MeAsync(client);
        me.DisplayName.ShouldBe("Robin Hale");
        me.Organisations.ShouldBe([new Organisation(id, "Northside Gaming")]);
        (await client.GetFromJsonAsync<Organisation>($"/api/organisations/{id}", Cancellation)).ShouldBe(new Organisation(id, "Northside Gaming"));
    }

    [Theory]
    [InlineData("   ", "required")]
    [InlineData("an organisation name that is much longer than the eighty characters the rule allows", "too-long")]
    public async Task An_invalid_name_is_a_field_error(string name, string rule)
    {
        var response = await api.As(Guid.NewGuid()).CreateAsync(Guid.NewGuid(), name);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await JsonAsync(response)).GetProperty("errors").GetProperty("name")[0].GetString().ShouldBe(rule);
    }

    [Fact]
    public async Task Repeating_a_creation_returns_the_original_organisation()
    {
        var client = api.As(Guid.NewGuid());
        var id = Guid.NewGuid();
        await client.CreateAsync(id, "Northside Gaming");

        var repeated = await client.CreateAsync(id, "Northside Gaming");

        repeated.StatusCode.ShouldBe(HttpStatusCode.Created);
        (await repeated.Content.ReadFromJsonAsync<Organisation>(Cancellation)).ShouldBe(new Organisation(id, "Northside Gaming"));
        (await MeAsync(client)).Organisations.ShouldHaveSingleItem();
    }

    [Fact]
    public async Task A_reused_identifier_with_another_name_or_person_conflicts_without_detail()
    {
        var id = Guid.NewGuid();
        await api.As(Guid.NewGuid()).CreateAsync(id, "Northside Gaming");

        var otherName = await api.As(Guid.NewGuid()).CreateAsync(id, "Elsewhere");
        var otherPerson = await api.As(Guid.NewGuid()).CreateAsync(id, "Northside Gaming");

        foreach (var response in new[] { otherName, otherPerson })
        {
            response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
            (await response.Content.ReadAsStringAsync(Cancellation)).ShouldNotContain("Northside");
        }
    }

    [Fact]
    public async Task Two_people_can_each_create_an_organisation_with_the_same_name()
    {
        var first = await api.As(Guid.NewGuid()).CreateAsync(Guid.NewGuid(), "Southside Club");
        var second = await api.As(Guid.NewGuid()).CreateAsync(Guid.NewGuid(), "Southside Club");

        first.StatusCode.ShouldBe(HttpStatusCode.Created);
        second.StatusCode.ShouldBe(HttpStatusCode.Created);
    }

    [Fact]
    public async Task People_with_the_same_display_name_see_only_their_own_organisations()
    {
        var first = api.As(Guid.NewGuid(), "Sam Lee");
        var second = api.As(Guid.NewGuid(), "Sam Lee");
        var id = Guid.NewGuid();
        await first.CreateAsync(id, "Sam's Club");

        (await MeAsync(second)).Organisations.ShouldBeEmpty();
        (await MeAsync(first)).Organisations.ShouldHaveSingleItem().Id.ShouldBe(id);
    }

    [Fact]
    public async Task A_changed_name_or_email_in_the_token_keeps_the_person()
    {
        var objectId = Guid.NewGuid();
        var id = Guid.NewGuid();
        await api.As(objectId, "Jo Smith").CreateAsync(id, "Jo's Club");

        var renamed = await MeAsync(api.As(objectId, "Jo Smith-Jones"));

        renamed.DisplayName.ShouldBe("Jo Smith-Jones");
        renamed.Organisations.ShouldHaveSingleItem().Id.ShouldBe(id);
    }

    [Fact]
    public async Task Another_owner_reading_by_direct_identifier_gets_the_generic_not_found()
    {
        var id = Guid.NewGuid();
        await api.As(Guid.NewGuid()).CreateAsync(id, "Private Club");

        var response = await api.As(Guid.NewGuid()).GetAsync($"/api/organisations/{id}", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var body = await response.Content.ReadAsStringAsync(Cancellation);
        body.ShouldContain("organisation-not-available");
        body.ShouldNotContain("Private Club");
    }

    [Fact]
    public async Task A_missing_organisation_gets_the_same_not_found_as_another_owners()
    {
        var response = await api.As(Guid.NewGuid()).GetAsync($"/api/organisations/{Guid.NewGuid()}", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await JsonAsync(response)).GetProperty("type").GetString().ShouldBe("organisation-not-available");
    }

    [Fact]
    public async Task A_removed_membership_loses_access_on_the_next_call()
    {
        var client = api.As(Guid.NewGuid());
        var id = Guid.NewGuid();
        await client.CreateAsync(id, "Short-lived Club");
        (await client.GetAsync($"/api/organisations/{id}", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);

        await api.ExecuteAsync("""DELETE FROM organisations."Memberships" WHERE "OrganisationId" = $1""", id);

        (await client.GetAsync($"/api/organisations/{id}", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await MeAsync(client)).Organisations.ShouldBeEmpty();
    }
}
