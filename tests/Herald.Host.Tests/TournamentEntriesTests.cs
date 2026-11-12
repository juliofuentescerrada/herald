using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// Tournaments and Registration together: terms and counts cross through the durable local queues (ADR 0016).
[Collection(OrganisationApiTests.Name)]
public class TournamentEntriesTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Tournament(HttpClient Client, string Organisation, Guid Id, object Configuration)
    {
        public string Path => $"{Organisation}/tournaments/{Id}";
    }

    private static object Configuration(int capacity = 2, string admission = "automatic", string entryKind = "individual", string checkIn = "optional") => new
    {
        title = "Saturday Open",
        gameVariant = "Example strategy · Standard variant",
        entryKind,
        capacity,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-13T18:00:00",
        plannedStartAt = "2026-11-14T10:00:00",
        timeZone = "Europe/Madrid",
        location = "online",
        admission,
        checkIn,
        visibility = "public",
        minimumRosterSize = entryKind == "team" ? 5 : (int?)null,
        maximumRosterSize = entryKind == "team" ? 7 : (int?)null,
        activePlayersPerSide = entryKind == "team" ? 5 : (int?)null,
    };

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private static int Revision(JsonElement tournament) => tournament.GetProperty("revision").GetInt32();

    // Waits for the messages each write causes, so the other module has caught up before the next step.
    private Task<HttpResponseMessage> SettledAsync(Func<Task<HttpResponseMessage>> request) => api.SettledAsync(request);

    // A fresh owner's tournament, published with registration open.
    private async Task<Tournament> OpenTournamentAsync(object? configuration = null)
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var tournament = new Tournament(client, $"/api/organisations/{organisation}", Guid.NewGuid(), configuration ?? Configuration());
        (await client.PostAsJsonAsync($"{tournament.Organisation}/tournaments", new { tournamentId = tournament.Id, configuration = tournament.Configuration }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
        (await SettledAsync(() => client.PostAsJsonAsync($"{tournament.Path}/publication", new { expectedRevision = 1 }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await SettledAsync(() => client.PostAsJsonAsync($"{tournament.Path}/registration/opening", new { expectedRevision = 2 }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        return tournament;
    }

    private async Task<JsonElement> EnterAsync(Tournament tournament, string name, string kind = "player")
    {
        var guest = Guid.NewGuid();
        (await tournament.Client.PutAsJsonAsync($"{tournament.Organisation}/guests/{guest}", new { kind, name, confirmNew = true }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        var response = await SettledAsync(() => tournament.Client.PutAsJsonAsync($"{tournament.Path}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation));
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return await JsonAsync(response);
    }

    private static JsonElement EntryOf(JsonElement field, string name) =>
        field.GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == name);

    private async Task<HttpResponseMessage> CancelAsync(Tournament tournament, JsonElement entry) =>
        await SettledAsync(() => tournament.Client.PostAsJsonAsync(
            $"{tournament.Path}/entries/{entry.GetProperty("id").GetGuid()}/cancellation",
            new { expectedRevision = entry.GetProperty("revision").GetInt32() },
            Cancellation));

    private static async Task<JsonElement> ReadAsync(Tournament tournament) =>
        await JsonAsync(await tournament.Client.GetAsync(tournament.Path, Cancellation));

    private async Task<HttpResponseMessage> WindowAsync(Tournament tournament, string action) =>
        await SettledAsync(async () => await tournament.Client.PostAsJsonAsync(
            $"{tournament.Path}/registration/{action}", new { expectedRevision = Revision(await ReadAsync(tournament)) }, Cancellation));

    private async Task<HttpResponseMessage> SaveAsync(Tournament tournament, object configuration) =>
        await SettledAsync(async () => await tournament.Client.PutAsJsonAsync(
            tournament.Path, new { expectedRevision = Revision(await ReadAsync(tournament)), configuration }, Cancellation));

    [Fact]
    public async Task Opening_a_published_tournaments_registration_lets_the_owner_enter_guests()
    {
        var tournament = await OpenTournamentAsync();

        var field = await EnterAsync(tournament, "Robin Vale");

        field.GetProperty("terms").GetProperty("registration").GetString().ShouldBe("open");
        field.GetProperty("terms").GetProperty("capacity").GetInt32().ShouldBe(2);
        EntryOf(field, "Robin Vale").GetProperty("state").GetString().ShouldBe("admitted");
    }

    [Fact]
    public async Task The_tournament_and_its_row_in_the_list_report_admitted_and_waiting_entries()
    {
        var tournament = await OpenTournamentAsync();
        await EnterAsync(tournament, "Robin Vale");
        await EnterAsync(tournament, "Sam Reed");
        await EnterAsync(tournament, "Jamie Brook");

        var read = await ReadAsync(tournament);
        var list = await JsonAsync(await tournament.Client.GetAsync($"{tournament.Organisation}/tournaments", Cancellation));

        read.GetProperty("admittedEntries").GetInt32().ShouldBe(2);
        read.GetProperty("waitingEntries").GetInt32().ShouldBe(1);
        var row = list.EnumerateArray().Single();
        row.GetProperty("admittedEntries").GetInt32().ShouldBe(2);
        row.GetProperty("waitingEntries").GetInt32().ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "tournament-setup: Capacity below the admitted entries")]
    public async Task Capacity_cannot_be_saved_below_the_admitted_entries()
    {
        var tournament = await OpenTournamentAsync(Configuration(capacity: 4));
        await EnterAsync(tournament, "Robin Vale");
        await EnterAsync(tournament, "Sam Reed");
        await EnterAsync(tournament, "Jamie Brook");

        var below = await SaveAsync(tournament, Configuration(capacity: 2));
        var equal = await SaveAsync(tournament, Configuration(capacity: 3));

        Errors(await JsonAsync(below), "capacity").ShouldBe(["below-admitted"]);
        equal.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Entry_kind_is_locked_by_a_waiting_entry_and_free_once_it_is_cancelled()
    {
        var tournament = await OpenTournamentAsync(Configuration(admission: "manual"));
        var field = await EnterAsync(tournament, "Robin Vale");

        var locked = await SaveAsync(tournament, Configuration(admission: "manual", entryKind: "team"));
        (await CancelAsync(tournament, EntryOf(field, "Robin Vale"))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var free = await SaveAsync(tournament, Configuration(admission: "manual", entryKind: "team"));

        Errors(await JsonAsync(locked), "entryKind").ShouldBe(["locked-by-entries"]);
        free.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    [Trait("covers", "tournament-setup: Check-in policy with confirmed check-ins")]
    public async Task The_check_in_policy_is_locked_by_a_check_in_from_registration_and_free_once_it_is_undone()
    {
        var tournament = await OpenTournamentAsync();
        var entry = EntryOf(await EnterAsync(tournament, "Robin Vale"), "Robin Vale");
        var checkIn = $"{tournament.Path}/entries/{entry.GetProperty("id").GetGuid()}/check-in";

        var beforeCheckIn = await SaveAsync(tournament, Configuration(checkIn: "mandatory"));
        (await SettledAsync(() => tournament.Client.PutAsJsonAsync(checkIn, new { expectedRevision = 0 }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var checkedIn = await ReadAsync(tournament);
        var locked = await SaveAsync(tournament, Configuration(checkIn: "optional"));
        (await SettledAsync(() => tournament.Client.DeleteAsync($"{checkIn}?expectedRevision=1", Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        var free = await SaveAsync(tournament, Configuration(checkIn: "optional"));

        beforeCheckIn.StatusCode.ShouldBe(HttpStatusCode.OK);
        checkedIn.GetProperty("checkedInEntries").GetInt32().ShouldBe(1);
        Errors(await JsonAsync(locked), "checkIn").ShouldBe(["locked-by-check-ins"]);
        free.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Closing_keeps_the_entries_and_reopening_fills_the_slots_freed_while_closed()
    {
        var tournament = await OpenTournamentAsync();
        var field = await EnterAsync(tournament, "Robin Vale");
        await EnterAsync(tournament, "Taylor Finch");
        await EnterAsync(tournament, "Sam Reed");
        (await WindowAsync(tournament, "closure")).StatusCode.ShouldBe(HttpStatusCode.OK);

        var cancelled = await JsonAsync(await CancelAsync(tournament, EntryOf(field, "Robin Vale")));
        (await WindowAsync(tournament, "opening")).StatusCode.ShouldBe(HttpStatusCode.OK);
        var reopened = await JsonAsync(await tournament.Client.GetAsync($"{tournament.Path}/entries", Cancellation));

        EntryOf(cancelled, "Sam Reed").GetProperty("state").GetString().ShouldBe("waiting");
        EntryOf(reopened, "Sam Reed").GetProperty("state").GetString().ShouldBe("admitted");
        EntryOf(reopened, "Sam Reed").GetProperty("admissionMethod").GetString().ShouldBe("promotion");
        (await ReadAsync(tournament)).GetProperty("admittedEntries").GetInt32().ShouldBe(2);
    }

    [Fact]
    public async Task Raising_the_capacity_in_the_configuration_admits_the_first_waiting_entry()
    {
        var tournament = await OpenTournamentAsync();
        await EnterAsync(tournament, "Robin Vale");
        await EnterAsync(tournament, "Taylor Finch");
        await EnterAsync(tournament, "Sam Reed");

        (await SaveAsync(tournament, Configuration(capacity: 3))).StatusCode.ShouldBe(HttpStatusCode.OK);

        var field = await JsonAsync(await tournament.Client.GetAsync($"{tournament.Path}/entries", Cancellation));
        EntryOf(field, "Sam Reed").GetProperty("state").GetString().ShouldBe("admitted");
        (await ReadAsync(tournament)).GetProperty("admittedEntries").GetInt32().ShouldBe(3);
    }

    [Fact]
    public async Task A_draft_has_no_field()
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var id = Guid.NewGuid();
        await SettledAsync(() => client.PostAsJsonAsync($"/api/organisations/{organisation}/tournaments", new { tournamentId = id, configuration = Configuration() }, Cancellation));

        var field = await client.GetAsync($"/api/organisations/{organisation}/tournaments/{id}/entries", Cancellation);

        field.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
