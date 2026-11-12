using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The entrant-check-in spec through the Admin API, with the tournament's terms delivered as Tournaments publishes them.
[Collection(OrganisationApiTests.Name)]
public class CheckInTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Owner(HttpClient Client, Guid Organisation)
    {
        public string Path => $"/api/organisations/{Organisation}";
    }

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private async Task<Owner> OwnerAsync()
    {
        var owner = new Owner(api.As(Guid.NewGuid()), Guid.NewGuid());
        (await owner.Client.CreateAsync(owner.Organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        return owner;
    }

    private async Task<Guid> TournamentAsync(Owner owner, int capacity = 2, Admission admission = Admission.Automatic)
    {
        var tournament = Guid.NewGuid();
        await api.PublishAndWaitAsync(new TournamentEntryTermsChanged(owner.Organisation, tournament, 3, RegistrationState.Open, capacity, EntryKind.Individual, admission));
        return tournament;
    }

    private static async Task<JsonElement> EnteredAsync(Owner owner, Guid tournament, string name)
    {
        var guest = Guid.NewGuid();
        (await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{guest}", new { kind = "player", name, confirmNew = true }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        var response = await owner.Client.PutAsJsonAsync($"{owner.Path}/tournaments/{tournament}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return EntryOf(await JsonAsync(response), name);
    }

    private static JsonElement EntryOf(JsonElement field, string name) =>
        field.GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == name);

    private static string EntryPath(Owner owner, Guid tournament, JsonElement entry) =>
        $"{owner.Path}/tournaments/{tournament}/entries/{entry.GetProperty("id").GetGuid()}";

    private static int CheckInRevision(JsonElement entry) =>
        entry.TryGetProperty("checkInRevision", out var revision) && revision.ValueKind == JsonValueKind.Number ? revision.GetInt32() : 0;

    private static Task<HttpResponseMessage> CheckInAsync(Owner owner, Guid tournament, JsonElement entry, int? revision = null) =>
        owner.Client.PutAsJsonAsync($"{EntryPath(owner, tournament, entry)}/check-in", new { expectedRevision = revision ?? CheckInRevision(entry) }, Cancellation);

    private static Task<HttpResponseMessage> UndoAsync(Owner owner, Guid tournament, JsonElement entry, int? revision = null) =>
        owner.Client.DeleteAsync($"{EntryPath(owner, tournament, entry)}/check-in?expectedRevision={revision ?? CheckInRevision(entry)}", Cancellation);

    [Fact]

    [Trait("covers", "entrant-check-in: An owner checks in an admitted player")]
    public async Task An_owner_checks_in_an_admitted_player()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var ana = await EnteredAsync(owner, tournament, "Ana Ruiz");
        ana.GetProperty("checkIn").GetString().ShouldBe("pending");

        var response = await CheckInAsync(owner, tournament, ana);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var field = await JsonAsync(response);
        var entry = EntryOf(field, "Ana Ruiz");
        entry.GetProperty("checkIn").GetString().ShouldBe("confirmed");
        entry.GetProperty("checkInRevision").GetInt32().ShouldBe(1);
        entry.GetProperty("checkInChangedAt").ValueKind.ShouldBe(JsonValueKind.String);
        field.GetProperty("checkedIn").GetInt32().ShouldBe(1);
    }

    [Fact]

    [Trait("covers", "entrant-check-in: A waiting entry cannot check in")]
    public async Task A_waiting_entry_cannot_check_in()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, admission: Admission.Manual);
        var waiting = await EnteredAsync(owner, tournament, "Rowan Lake");
        (!waiting.TryGetProperty("checkIn", out var checkIn) || checkIn.ValueKind == JsonValueKind.Null).ShouldBeTrue();

        var response = await CheckInAsync(owner, tournament, waiting);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "entry").ShouldBe(["not-admitted"]);
    }

    [Fact]

    [Trait("covers", "entrant-check-in: A cancelled entry cannot check in")]
    public async Task A_cancelled_entry_cannot_check_in()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var entry = await EnteredAsync(owner, tournament, "Sam Reed");
        (await owner.Client.PostAsJsonAsync($"{EntryPath(owner, tournament, entry)}/cancellation", new { expectedRevision = 1 }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await CheckInAsync(owner, tournament, entry);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "entry").ShouldBe(["cancelled"]);
    }

    [Fact]

    [Trait("covers", "entrant-check-in: An owner undoes a check-in made by mistake")]
    public async Task An_owner_undoes_a_check_in_and_a_repeat_returns_the_field()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var leo = await EnteredAsync(owner, tournament, "Leo Martín");
        await CheckInAsync(owner, tournament, leo);

        var undone = await UndoAsync(owner, tournament, leo, revision: 1);
        var repeated = await UndoAsync(owner, tournament, leo, revision: 1);

        undone.StatusCode.ShouldBe(HttpStatusCode.OK);
        var entry = EntryOf(await JsonAsync(undone), "Leo Martín");
        entry.GetProperty("checkIn").GetString().ShouldBe("pending");
        entry.GetProperty("checkInRevision").GetInt32().ShouldBe(2);
        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        EntryOf(await JsonAsync(repeated), "Leo Martín").GetProperty("checkInRevision").GetInt32().ShouldBe(2);
    }

    [Fact]

    [Trait("covers", "entrant-check-in: A stale check-in write is a conflict")]
    public async Task A_stale_check_in_write_is_a_conflict()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var entry = await EnteredAsync(owner, tournament, "Taylor Finch");
        await CheckInAsync(owner, tournament, entry, revision: 0);
        await UndoAsync(owner, tournament, entry, revision: 1);
        await CheckInAsync(owner, tournament, entry, revision: 2);

        var response = await UndoAsync(owner, tournament, entry, revision: 1);

        response.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var problem = await JsonAsync(response);
        problem.GetProperty("type").GetString().ShouldBe("check-in-revision-conflict");
        problem.GetProperty("currentRevision").GetInt32().ShouldBe(3);
    }

    [Fact]
    public async Task An_admission_in_another_tab_does_not_conflict_with_a_check_in()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, admission: Admission.Manual);
        var entry = await EnteredAsync(owner, tournament, "Robin Vale");
        (await owner.Client.PostAsJsonAsync($"{EntryPath(owner, tournament, entry)}/admission", new { expectedRevision = 1 }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await CheckInAsync(owner, tournament, entry, revision: 0);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        EntryOf(await JsonAsync(response), "Robin Vale").GetProperty("checkIn").GetString().ShouldBe("confirmed");
    }

    [Fact]

    [Trait("covers", "entrant-check-in: Cancelling keeps the evidence")]
    public async Task Cancelling_keeps_the_check_in_and_stops_counting_it()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 4);
        foreach (var name in new[] { "Ana Ruiz", "Leo Martín", "Sam Reed" })
        {
            await CheckInAsync(owner, tournament, await EnteredAsync(owner, tournament, name));
        }

        var ana = EntryOf(await JsonAsync(await owner.Client.GetAsync($"{owner.Path}/tournaments/{tournament}/entries", Cancellation)), "Ana Ruiz");
        var response = await owner.Client.PostAsJsonAsync($"{EntryPath(owner, tournament, ana)}/cancellation", new { expectedRevision = 1 }, Cancellation);

        var field = await JsonAsync(response);
        field.GetProperty("checkedIn").GetInt32().ShouldBe(2);
        EntryOf(field, "Ana Ruiz").GetProperty("checkIn").GetString().ShouldBe("confirmed");
    }

    [Fact]
    public async Task Another_organisations_owner_gets_the_generic_not_found()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var entry = await EnteredAsync(owner, tournament, "Ana Ruiz");
        var stranger = await OwnerAsync();

        var checkIn = await CheckInAsync(stranger, tournament, entry);
        var undo = await UndoAsync(stranger, tournament, entry);

        checkIn.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        undo.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
