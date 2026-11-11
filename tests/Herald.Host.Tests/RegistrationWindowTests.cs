using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(OrganisationApiTests.Name)]
public class RegistrationWindowTests(OrganisationApi api)
{
    private static readonly object _complete = new
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

    private static readonly object _withoutClosure = new
    {
        title = "Saturday Open",
        gameVariant = "Example strategy · Standard variant",
        entryKind = "individual",
        capacity = 8,
        registrationOpensAt = "2026-11-10T09:00:00",
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

    private static string[] Strings(JsonElement element) => [.. element.EnumerateArray().Select(value => value.GetString()!)];

    private static string[] Errors(JsonElement problem, string field) => Strings(problem.GetProperty("errors").GetProperty(field));

    private async Task<(HttpClient Client, string Tournaments)> OwnerAsync()
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        return (client, $"/api/organisations/{organisation}/tournaments");
    }

    private static Task<HttpResponseMessage> OpenAsync(HttpClient client, string tournaments, Guid id, int expectedRevision) =>
        client.PostAsJsonAsync($"{tournaments}/{id}/registration/opening", new { expectedRevision }, Cancellation);

    private static Task<HttpResponseMessage> CloseAsync(HttpClient client, string tournaments, Guid id, int expectedRevision) =>
        client.PostAsJsonAsync($"{tournaments}/{id}/registration/closure", new { expectedRevision }, Cancellation);

    private static Task<HttpResponseMessage> SaveAsync(HttpClient client, string tournaments, Guid id, int expectedRevision, object configuration) =>
        client.PutAsJsonAsync($"{tournaments}/{id}", new { expectedRevision, configuration }, Cancellation);

    private static async Task<JsonElement> ReadAsync(HttpClient client, string tournaments, Guid id) =>
        await JsonAsync(await client.GetAsync($"{tournaments}/{id}", Cancellation));

    // A tournament of a fresh owner, published at revision 2, or left a draft at revision 1.
    private async Task<(HttpClient Client, string Tournaments, Guid Id)> TournamentAsync(object? configuration = null, bool publish = true)
    {
        var (client, tournaments) = await OwnerAsync();
        var id = Guid.NewGuid();
        var created = await client.PostAsJsonAsync(tournaments, new { tournamentId = id, configuration = configuration ?? _complete }, Cancellation);
        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        if (publish)
        {
            (await client.PostAsJsonAsync($"{tournaments}/{id}/publication", new { expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        return (client, tournaments, id);
    }

    [Fact]
    public async Task Registration_is_opened_by_the_acting_person_and_nothing_else_changes()
    {
        var (client, tournaments, id) = await TournamentAsync();

        var response = await OpenAsync(client, tournaments, id, 2);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var opened = await JsonAsync(response);
        opened.GetProperty("registration").GetString().ShouldBe("open");
        opened.GetProperty("publication").GetString().ShouldBe("published");
        opened.GetProperty("competition").GetString().ShouldBe("preparation");
        opened.GetProperty("revision").GetInt32().ShouldBe(3);
        opened.GetProperty("registrationChangedAt").GetDateTimeOffset().ShouldBeGreaterThan(DateTimeOffset.UtcNow.AddMinutes(-1));
        opened.GetProperty("configuration").GetProperty("capacity").GetInt32().ShouldBe(8);
        (await api.CountAsync(
            """
            SELECT count(*) FROM tournaments."Tournaments" t JOIN organisations."Persons" p ON p."Id" = t."RegistrationChangedBy"
            WHERE t."Id" = $1 AND t."Registration" = 'Open'
            """,
            id)).ShouldBe(1);
    }

    [Fact]
    public async Task Opening_without_the_registration_dates_names_them_and_registration_stays_not_open()
    {
        var (client, tournaments, id) = await TournamentAsync(_withoutClosure);

        var read = await ReadAsync(client, tournaments, id);
        Strings(read.GetProperty("missingForRegistration")).ShouldBe(["registrationClosesAt"]);

        var response = await OpenAsync(client, tournaments, id, 2);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registrationClosesAt").ShouldBe(["required"]);
        (await ReadAsync(client, tournaments, id)).GetProperty("registration").GetString().ShouldBe("notOpen");
    }

    [Fact]
    public async Task A_draft_cannot_open_registration()
    {
        var (client, tournaments, id) = await TournamentAsync(publish: false);

        var response = await OpenAsync(client, tournaments, id, 1);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registration").ShouldBe(["not-published"]);
    }

    [Fact]
    public async Task Registration_is_closed_and_reopened()
    {
        var (client, tournaments, id) = await TournamentAsync();
        (await OpenAsync(client, tournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var closed = await JsonAsync(await CloseAsync(client, tournaments, id, 3));
        closed.GetProperty("registration").GetString().ShouldBe("closed");
        closed.GetProperty("publication").GetString().ShouldBe("published");

        var reopened = await JsonAsync(await OpenAsync(client, tournaments, id, 4));
        reopened.GetProperty("registration").GetString().ShouldBe("open");
        reopened.GetProperty("revision").GetInt32().ShouldBe(5);
    }

    [Fact]
    public async Task A_closed_registration_that_lost_a_date_cannot_reopen()
    {
        var (client, tournaments, id) = await TournamentAsync();
        (await OpenAsync(client, tournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await CloseAsync(client, tournaments, id, 3)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await SaveAsync(client, tournaments, id, 4, _withoutClosure)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await OpenAsync(client, tournaments, id, 5);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registrationClosesAt").ShouldBe(["required"]);
        (await ReadAsync(client, tournaments, id)).GetProperty("registration").GetString().ShouldBe("closed");
    }

    [Fact]
    public async Task A_registration_that_was_never_opened_cannot_be_closed()
    {
        var (client, tournaments, id) = await TournamentAsync();

        var response = await CloseAsync(client, tournaments, id, 2);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registration").ShouldBe(["not-open"]);
    }

    [Fact]
    public async Task Repeating_an_opening_returns_the_open_tournament_without_a_second_effect()
    {
        var (client, tournaments, id) = await TournamentAsync();
        (await OpenAsync(client, tournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.OK);
        // Read back stored: PostgreSQL keeps microseconds, the first answer had .NET's ticks.
        var first = await ReadAsync(client, tournaments, id);

        var response = await OpenAsync(client, tournaments, id, 2);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var repeated = await JsonAsync(response);
        repeated.GetProperty("revision").GetInt32().ShouldBe(3);
        repeated.GetProperty("registrationChangedAt").GetDateTimeOffset().ShouldBe(first.GetProperty("registrationChangedAt").GetDateTimeOffset());
    }

    [Fact]
    public async Task Opening_from_an_older_revision_conflicts_and_registration_stays_not_open()
    {
        var (client, tournaments, id) = await TournamentAsync();
        (await SaveAsync(client, tournaments, id, 2, _withoutClosure)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await OpenAsync(client, tournaments, id, 2);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await JsonAsync(response)).GetProperty("currentRevision").GetInt32().ShouldBe(3);
        (await ReadAsync(client, tournaments, id)).GetProperty("registration").GetString().ShouldBe("notOpen");
    }

    [Fact]
    public async Task A_save_cannot_remove_a_registration_date_while_registration_is_open()
    {
        var (client, tournaments, id) = await TournamentAsync();
        (await OpenAsync(client, tournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await SaveAsync(client, tournaments, id, 3, _withoutClosure);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "registrationClosesAt").ShouldBe(["required"]);
        (await ReadAsync(client, tournaments, id)).GetProperty("configuration").GetProperty("registrationClosesAt").GetString().ShouldBe("2026-11-13T18:00:00");
    }

    [Fact]
    public async Task A_save_can_remove_a_registration_date_while_registration_is_not_open()
    {
        var (client, tournaments, id) = await TournamentAsync();

        (await SaveAsync(client, tournaments, id, 2, _withoutClosure)).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task The_list_shows_the_registration_state_of_each_tournament()
    {
        var (client, tournaments, id) = await TournamentAsync();
        var other = Guid.NewGuid();
        (await client.PostAsJsonAsync(tournaments, new { tournamentId = other, configuration = new { title = "Sunday Open" } }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Created);
        (await OpenAsync(client, tournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var list = await JsonAsync(await client.GetAsync(tournaments, Cancellation));

        var registrations = list.EnumerateArray().ToDictionary(row => row.GetProperty("id").GetGuid(), row => row.GetProperty("registration").GetString());
        registrations[id].ShouldBe("open");
        registrations[other].ShouldBe("notOpen");
    }

    [Fact]
    public async Task Another_owner_opening_or_closing_a_tournament_gets_the_generic_not_found()
    {
        var (_, _, id) = await TournamentAsync();
        var (other, otherTournaments) = await OwnerAsync();

        (await OpenAsync(other, otherTournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await CloseAsync(other, otherTournaments, id, 2)).StatusCode.ShouldBe(HttpStatusCode.NotFound);

        (await api.CountAsync("""SELECT count(*) FROM tournaments."Tournaments" WHERE "Id" = $1 AND "Registration" = 'NotOpen' AND "Revision" = 2""", id)).ShouldBe(1);
    }
}
