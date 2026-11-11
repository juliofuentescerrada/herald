using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(OrganisationApiTests.Name)]
public class TournamentSetupTests(OrganisationApi api)
{
    private static readonly object _completeIndividual = new
    {
        title = "Saturday Open",
        gameVariant = "Example strategy · Standard variant",
        entryKind = "individual",
        capacity = 8,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-13T18:00:00",
        plannedStartAt = "2026-11-14T10:00:00",
        timeZone = "Europe/Madrid",
        location = "onSite",
        venue = "Madrid",
        admission = "manual",
        checkIn = "mandatory",
        visibility = "public",
    };

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(rule => rule.GetString()!)];

    // A fresh owner with one organisation; returns the client and the tournaments address.
    private async Task<(HttpClient Client, string Tournaments)> OwnerAsync()
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        return (client, $"/api/organisations/{organisation}/tournaments");
    }

    private static Task<HttpResponseMessage> CreateAsync(HttpClient client, string tournaments, Guid id, object configuration) =>
        client.PostAsJsonAsync(tournaments, new { tournamentId = id, configuration }, Cancellation);

    private static Task<HttpResponseMessage> SaveAsync(HttpClient client, string tournaments, Guid id, int expectedRevision, object configuration) =>
        client.PutAsJsonAsync($"{tournaments}/{id}", new { expectedRevision, configuration }, Cancellation);

    private static Task<HttpResponseMessage> PublishAsync(HttpClient client, string tournaments, Guid id, int expectedRevision) =>
        client.PostAsJsonAsync($"{tournaments}/{id}/publication", new { expectedRevision }, Cancellation);

    private async Task<(HttpClient Client, string Tournaments, Guid Id)> DraftAsync(object? configuration = null)
    {
        var (client, tournaments) = await OwnerAsync();
        var id = Guid.NewGuid();
        (await CreateAsync(client, tournaments, id, configuration ?? new { title = "Saturday Open" })).StatusCode.ShouldBe(HttpStatusCode.Created);
        return (client, tournaments, id);
    }

    [Fact]
    public async Task A_draft_is_created_with_a_title_only_by_the_acting_person()
    {
        var (client, tournaments) = await OwnerAsync();
        var id = Guid.NewGuid();

        var response = await CreateAsync(client, tournaments, id, new { title = "  Saturday Open " });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        response.Headers.Location!.ToString().ShouldBe($"{tournaments}/{id}");
        var created = await JsonAsync(response);
        created.GetProperty("id").GetGuid().ShouldBe(id);
        created.GetProperty("revision").GetInt32().ShouldBe(1);
        created.GetProperty("publication").GetString().ShouldBe("draft");
        created.GetProperty("registration").GetString().ShouldBe("notOpen");
        created.GetProperty("competition").GetString().ShouldBe("preparation");
        created.GetProperty("configuration").GetProperty("title").GetString().ShouldBe("Saturday Open");
        created.GetProperty("configuration").GetProperty("capacity").ValueKind.ShouldBe(JsonValueKind.Null);
        // The membership step handed over the person who acts (design D-5).
        (await api.CountAsync(
            """SELECT count(*) FROM tournaments."Tournaments" t JOIN organisations."Persons" p ON p."Id" = t."CreatedBy" WHERE t."Id" = $1""", id))
            .ShouldBe(1);
    }

    [Theory]
    [InlineData("   ", "required")]
    [InlineData("long", "too-long")]
    public async Task An_invalid_title_is_a_field_error_and_nothing_is_created(string title, string rule)
    {
        var (client, tournaments) = await OwnerAsync();

        var response = await CreateAsync(client, tournaments, Guid.NewGuid(), new { title = title == "long" ? new string('a', 121) : title });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "title").ShouldBe([rule]);
        (await client.GetFromJsonAsync<JsonElement>(tournaments, Cancellation)).GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task Repeating_a_creation_returns_the_original_tournament()
    {
        var (client, tournaments, id) = await DraftAsync();

        var repeated = await CreateAsync(client, tournaments, id, new { title = "Saturday Open" });

        repeated.StatusCode.ShouldBe(HttpStatusCode.Created);
        (await JsonAsync(repeated)).GetProperty("revision").GetInt32().ShouldBe(1);
        (await client.GetFromJsonAsync<JsonElement>(tournaments, Cancellation)).GetArrayLength().ShouldBe(1);
    }

    [Fact]
    public async Task A_reused_identifier_with_other_content_or_from_another_organisation_conflicts_without_detail()
    {
        var (client, tournaments, id) = await DraftAsync(new { title = "Hidden Cup" });
        var (other, otherTournaments) = await OwnerAsync();

        var otherContent = await CreateAsync(client, tournaments, id, new { title = "Elsewhere" });
        var otherOrganisation = await CreateAsync(other, otherTournaments, id, new { title = "Hidden Cup" });

        foreach (var response in new[] { otherContent, otherOrganisation })
        {
            response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
            (await response.Content.ReadAsStringAsync(Cancellation)).ShouldNotContain("Hidden");
        }
    }

    [Fact]
    public async Task A_partial_draft_is_saved_and_absent_values_stay_absent()
    {
        var (client, tournaments, id) = await DraftAsync();

        var saved = await SaveAsync(client, tournaments, id, 1, new { title = "Saturday Open", entryKind = "team", capacity = 16 });

        saved.StatusCode.ShouldBe(HttpStatusCode.OK);
        var read = await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation);
        read.GetProperty("revision").GetInt32().ShouldBe(2);
        read.GetProperty("configuration").GetProperty("entryKind").GetString().ShouldBe("team");
        read.GetProperty("configuration").GetProperty("capacity").GetInt32().ShouldBe(16);
        read.GetProperty("configuration").GetProperty("plannedStartAt").ValueKind.ShouldBe(JsonValueKind.Null);
    }

    [Fact]
    public async Task A_save_that_breaks_rules_names_each_field_and_changes_nothing()
    {
        var (client, tournaments, id) = await DraftAsync();

        var response = await SaveAsync(client, tournaments, id, 1, new
        {
            title = "Saturday Team League",
            entryKind = "team",
            capacity = 1,
            minimumRosterSize = 5,
            maximumRosterSize = 4,
            activePlayersPerSide = 5,
            registrationClosesAt = "2026-11-14T12:00:00",
            plannedStartAt = "2026-11-14T10:00:00",
            timeZone = "Mars/Olympus",
        });

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(response);
        Errors(problem, "capacity").ShouldBe(["out-of-range"]);
        Errors(problem, "maximumRosterSize").ShouldBe(["below-minimum"]);
        Errors(problem, "registrationClosesAt").ShouldBe(["after-planned-start"]);
        Errors(problem, "timeZone").ShouldBe(["unknown"]);
        var read = await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation);
        read.GetProperty("revision").GetInt32().ShouldBe(1);
        read.GetProperty("configuration").GetProperty("title").GetString().ShouldBe("Saturday Open");
    }

    [Fact]
    public async Task Local_date_times_are_read_back_as_they_were_written()
    {
        var (client, tournaments, id) = await DraftAsync(_completeIndividual);

        var read = await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation);

        read.GetProperty("configuration").GetProperty("plannedStartAt").GetString().ShouldBe("2026-11-14T10:00:00");
        read.GetProperty("configuration").GetProperty("registrationClosesAt").GetString().ShouldBe("2026-11-13T18:00:00");
        read.GetProperty("missingForPublication").GetArrayLength().ShouldBe(0);
        read.GetProperty("profile").GetString().ShouldBe("singleRoundRobin-3-1-0");
    }

    [Fact]
    public async Task A_draft_reports_what_it_lacks_and_cannot_be_published_until_complete()
    {
        var (client, tournaments, id) = await DraftAsync(new { title = "Saturday Open", entryKind = "team", capacity = 16 });

        var read = await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation);
        var response = await PublishAsync(client, tournaments, id, 1);

        read.GetProperty("missingForPublication").EnumerateArray().Select(field => field.GetString()).ShouldBe(
            ["gameVariant", "minimumRosterSize", "maximumRosterSize", "activePlayersPerSide", "plannedStartAt", "timeZone", "location", "admission", "checkIn", "visibility"]);
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(response);
        Errors(problem, "timeZone").ShouldBe(["required"]);
        Errors(problem, "activePlayersPerSide").ShouldBe(["required"]);
        (await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation)).GetProperty("publication").GetString().ShouldBe("draft");
    }

    [Fact]
    public async Task A_complete_draft_is_published_and_nothing_else_changes()
    {
        var (client, tournaments, id) = await DraftAsync(_completeIndividual);

        var response = await PublishAsync(client, tournaments, id, 1);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var published = await JsonAsync(response);
        published.GetProperty("publication").GetString().ShouldBe("published");
        published.GetProperty("registration").GetString().ShouldBe("notOpen");
        published.GetProperty("competition").GetString().ShouldBe("preparation");
        published.GetProperty("revision").GetInt32().ShouldBe(2);
        (await api.CountAsync(
            """SELECT count(*) FROM tournaments."Tournaments" WHERE "Id" = $1 AND "PublishedBy" = "CreatedBy" AND "PublishedAt" IS NOT NULL""", id))
            .ShouldBe(1);
    }

    [Fact]
    public async Task A_draft_without_registration_dates_is_published()
    {
        var (client, tournaments, id) = await DraftAsync(new
        {
            title = "Online Open",
            gameVariant = "Example strategy",
            entryKind = "individual",
            capacity = 4,
            plannedStartAt = "2026-11-14T10:00:00",
            timeZone = "Europe/Madrid",
            location = "online",
            admission = "automatic",
            checkIn = "optional",
            visibility = "unlisted",
        });

        (await PublishAsync(client, tournaments, id, 1)).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Repeating_a_publication_returns_the_published_tournament_without_a_second_effect()
    {
        var (client, tournaments, id) = await DraftAsync(_completeIndividual);
        await PublishAsync(client, tournaments, id, 1);

        var repeated = await PublishAsync(client, tournaments, id, 1);

        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(repeated)).GetProperty("revision").GetInt32().ShouldBe(2);
    }

    [Fact]
    public async Task A_published_tournament_changes_its_capacity_but_cannot_be_left_incomplete()
    {
        var (client, tournaments, id) = await DraftAsync(_completeIndividual);
        await PublishAsync(client, tournaments, id, 1);
        var complete = JsonSerializer.SerializeToNode(_completeIndividual)!.AsObject();
        complete["capacity"] = 16;
        var incomplete = complete.DeepClone().AsObject();
        incomplete.Remove("plannedStartAt");

        var changed = await SaveAsync(client, tournaments, id, 2, complete);
        var rejected = await SaveAsync(client, tournaments, id, 3, incomplete);

        changed.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(changed)).GetProperty("publication").GetString().ShouldBe("published");
        rejected.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(rejected), "plannedStartAt").ShouldBe(["required"]);
        (await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation))
            .GetProperty("configuration").GetProperty("plannedStartAt").GetString().ShouldBe("2026-11-14T10:00:00");
    }

    [Fact]
    public async Task A_save_based_on_an_older_revision_conflicts_and_the_earlier_change_is_intact()
    {
        var (client, tournaments, id) = await DraftAsync();
        await SaveAsync(client, tournaments, id, 1, new { title = "First tab" });

        var stale = await SaveAsync(client, tournaments, id, 1, new { title = "Second tab" });

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var problem = await JsonAsync(stale);
        problem.GetProperty("type").GetString().ShouldBe("tournament-revision-conflict");
        problem.GetProperty("currentRevision").GetInt32().ShouldBe(2);
        (await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation))
            .GetProperty("configuration").GetProperty("title").GetString().ShouldBe("First tab");
    }

    [Fact]
    public async Task Repeating_a_save_returns_the_current_tournament_without_another_revision()
    {
        var (client, tournaments, id) = await DraftAsync();
        await SaveAsync(client, tournaments, id, 1, new { title = "Renamed Open" });

        var repeated = await SaveAsync(client, tournaments, id, 1, new { title = "Renamed Open" });

        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(repeated)).GetProperty("revision").GetInt32().ShouldBe(2);
    }

    [Fact]
    public async Task Publishing_a_stale_review_conflicts_and_leaves_a_draft()
    {
        var (client, tournaments, id) = await DraftAsync(_completeIndividual);
        var changed = JsonSerializer.SerializeToNode(_completeIndividual)!.AsObject();
        changed["capacity"] = 16;
        await SaveAsync(client, tournaments, id, 1, changed);

        var stale = await PublishAsync(client, tournaments, id, 1);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await client.GetFromJsonAsync<JsonElement>($"{tournaments}/{id}", Cancellation)).GetProperty("publication").GetString().ShouldBe("draft");
    }

    [Fact]
    public async Task A_list_holds_only_the_organisations_tournaments_newest_first()
    {
        var (client, tournaments, first) = await DraftAsync(new { title = "First" });
        var second = Guid.NewGuid();
        await CreateAsync(client, tournaments, second, _completeIndividual);
        await DraftAsync(new { title = "Another organisation's" });

        var list = await client.GetFromJsonAsync<JsonElement>(tournaments, Cancellation);

        list.EnumerateArray().Select(item => item.GetProperty("id").GetGuid()).ShouldBe([second, first]);
        var newest = list[0];
        newest.GetProperty("title").GetString().ShouldBe("Saturday Open");
        newest.GetProperty("entryKind").GetString().ShouldBe("individual");
        newest.GetProperty("capacity").GetInt32().ShouldBe(8);
        newest.GetProperty("plannedStartAt").GetString().ShouldBe("2026-11-14T10:00:00");
        newest.GetProperty("timeZone").GetString().ShouldBe("Europe/Madrid");
        newest.GetProperty("publication").GetString().ShouldBe("draft");
        newest.GetProperty("registration").GetString().ShouldBe("notOpen");
        newest.GetProperty("competition").GetString().ShouldBe("preparation");
    }

    [Fact]
    public async Task Another_owner_reading_or_writing_a_tournament_gets_the_generic_not_found()
    {
        var (_, _, id) = await DraftAsync(new { title = "Private Cup" });
        var (other, otherTournaments) = await OwnerAsync();

        HttpResponseMessage[] responses =
        [
            await other.GetAsync($"{otherTournaments}/{id}", Cancellation),
            await SaveAsync(other, otherTournaments, id, 1, new { title = "Taken" }),
            await PublishAsync(other, otherTournaments, id, 1),
            await other.GetAsync($"{otherTournaments}/{Guid.NewGuid()}", Cancellation),
        ];

        foreach (var response in responses)
        {
            response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
            (await response.Content.ReadAsStringAsync(Cancellation)).ShouldNotContain("Private Cup");
        }

        (await api.CountAsync("""SELECT count(*) FROM tournaments."Tournaments" WHERE "Id" = $1 AND "Revision" = 1""", id)).ShouldBe(1);
    }

    [Fact]
    public async Task Another_owner_cannot_reach_tournaments_through_the_organisations_address()
    {
        var (_, tournaments, id) = await DraftAsync(new { title = "Private Cup" });
        var other = api.As(Guid.NewGuid());

        (await other.GetAsync(tournaments, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var response = await other.GetAsync($"{tournaments}/{id}", Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await JsonAsync(response)).GetProperty("type").GetString().ShouldBe("organisation-not-available");
    }

    [Fact]
    public async Task The_public_document_has_no_tournament_operation()
    {
        var document = await api.Anonymous().GetStringAsync("/openapi/public.json", Cancellation);

        document.ShouldNotContain("ournament");
    }
}
