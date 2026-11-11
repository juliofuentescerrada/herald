using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// Registration's API, with the tournament's terms delivered as Tournaments publishes them.
[Collection(OrganisationApiTests.Name)]
public class GuestEntriesTests(OrganisationApi api)
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

    // The terms Tournaments would publish for a published tournament of the owner's organisation.
    private async Task<Guid> TournamentAsync(
        Owner owner, int capacity = 2, Admission admission = Admission.Automatic, EntryKind kind = EntryKind.Individual,
        RegistrationState registration = RegistrationState.Open, int revision = 3, Guid? id = null)
    {
        var tournament = id ?? Guid.NewGuid();
        await api.PublishAndWaitAsync(new TournamentEntryTermsChanged(owner.Organisation, tournament, revision, registration, capacity, kind, admission));
        return tournament;
    }

    private static async Task<Guid> GuestAsync(Owner owner, string name, string kind = "player")
    {
        var id = Guid.NewGuid();
        var response = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind, name, confirmNew = true }, Cancellation);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return id;
    }

    private static Task<HttpResponseMessage> EnterAsync(Owner owner, Guid tournament, Guid guest, Guid? entry = null) =>
        owner.Client.PutAsJsonAsync($"{owner.Path}/tournaments/{tournament}/entries/{entry ?? Guid.NewGuid()}", new { guestId = guest }, Cancellation);

    private static async Task<JsonElement> EnteredAsync(Owner owner, Guid tournament, string name, Guid? entry = null)
    {
        var response = await EnterAsync(owner, tournament, await GuestAsync(owner, name), entry);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return await JsonAsync(response);
    }

    private static async Task<JsonElement> FieldAsync(Owner owner, Guid tournament)
    {
        var response = await owner.Client.GetAsync($"{owner.Path}/tournaments/{tournament}/entries", Cancellation);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return await JsonAsync(response);
    }

    private static JsonElement EntryOf(JsonElement field, string name) =>
        field.GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == name);

    private static Task<HttpResponseMessage> AdmitAsync(Owner owner, Guid tournament, JsonElement entry, string? reason = null) =>
        owner.Client.PostAsJsonAsync(
            $"{owner.Path}/tournaments/{tournament}/entries/{entry.GetProperty("id").GetGuid()}/admission",
            new { expectedRevision = entry.GetProperty("revision").GetInt32(), reason },
            Cancellation);

    private static Task<HttpResponseMessage> CancelAsync(Owner owner, Guid tournament, JsonElement entry, int? revision = null) =>
        owner.Client.PostAsJsonAsync(
            $"{owner.Path}/tournaments/{tournament}/entries/{entry.GetProperty("id").GetGuid()}/cancellation",
            new { expectedRevision = revision ?? entry.GetProperty("revision").GetInt32() },
            Cancellation);

    [Fact]
    public async Task A_guest_player_is_created_and_found_by_the_start_of_its_name()
    {
        var owner = await OwnerAsync();
        var id = Guid.NewGuid();

        var created = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind = "player", name = " Robin Vale " }, Cancellation);
        var found = await JsonAsync(await owner.Client.GetAsync($"{owner.Path}/guests?kind=player&name=róbin", Cancellation));

        created.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(created)).GetProperty("name").GetString().ShouldBe("Robin Vale");
        found.EnumerateArray().Select(guest => guest.GetProperty("id").GetGuid()).ShouldBe([id]);
    }

    [Fact]
    public async Task A_guest_name_is_required_and_at_most_80_characters()
    {
        var owner = await OwnerAsync();

        var blank = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{Guid.NewGuid()}", new { kind = "player", name = " " }, Cancellation);
        var tooLong = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{Guid.NewGuid()}", new { kind = "player", name = new string('a', 81) }, Cancellation);

        Errors(await JsonAsync(blank), "name").ShouldBe(["required"]);
        Errors(await JsonAsync(tooLong), "name").ShouldBe(["too-long"]);
    }

    [Fact]
    public async Task A_possible_duplicate_is_reported_and_created_only_when_confirmed()
    {
        var owner = await OwnerAsync();
        var first = await GuestAsync(owner, "Robin Vale");
        var id = Guid.NewGuid();

        var duplicate = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind = "player", name = "robin  vale" }, Cancellation);
        var team = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{Guid.NewGuid()}", new { kind = "team", name = "Robin Vale" }, Cancellation);
        var confirmed = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind = "player", name = "robin  vale", confirmNew = true }, Cancellation);

        duplicate.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var problem = await JsonAsync(duplicate);
        problem.GetProperty("type").GetString().ShouldBe("possible-duplicate");
        problem.GetProperty("matches").EnumerateArray().Select(match => match.GetProperty("id").GetGuid()).ShouldBe([first]);
        team.StatusCode.ShouldBe(HttpStatusCode.OK);
        confirmed.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_repeated_creation_returns_the_guest_and_a_reused_identifier_is_refused()
    {
        var owner = await OwnerAsync();
        var id = await GuestAsync(owner, "Robin Vale");

        var repeat = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind = "player", name = "Robin Vale" }, Cancellation);
        var reused = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{id}", new { kind = "player", name = "Sam Reed" }, Cancellation);

        repeat.StatusCode.ShouldBe(HttpStatusCode.OK);
        reused.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await JsonAsync(reused)).GetProperty("type").GetString().ShouldBe("guest-identifier-reused");
    }

    [Fact]
    public async Task Another_organisations_guests_are_neither_found_nor_compared_nor_entered()
    {
        var owner = await OwnerAsync();
        var other = await OwnerAsync();
        var theirs = await GuestAsync(other, "Robin Vale");
        var tournament = await TournamentAsync(owner);

        var found = await JsonAsync(await owner.Client.GetAsync($"{owner.Path}/guests?kind=player&name=robin", Cancellation));
        var created = await owner.Client.PutAsJsonAsync($"{owner.Path}/guests/{Guid.NewGuid()}", new { kind = "player", name = "Robin Vale" }, Cancellation);
        var entered = await EnterAsync(owner, tournament, theirs);

        found.GetArrayLength().ShouldBe(0);
        created.StatusCode.ShouldBe(HttpStatusCode.OK);
        Errors(await JsonAsync(entered), "guestId").ShouldBe(["not-found"]);
    }

    [Fact]
    public async Task Players_are_admitted_until_the_field_is_full_and_the_next_one_waits()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 2);

        await EnteredAsync(owner, tournament, "Robin Vale");
        await EnteredAsync(owner, tournament, "Sam Reed");
        var field = await EnteredAsync(owner, tournament, "Jamie Brook");

        field.GetProperty("admitted").GetInt32().ShouldBe(2);
        field.GetProperty("waiting").GetInt32().ShouldBe(1);
        var waiting = EntryOf(field, "Jamie Brook");
        waiting.GetProperty("state").GetString().ShouldBe("waiting");
        waiting.GetProperty("waitingReason").GetString().ShouldBe("capacityFull");
        waiting.GetProperty("position").GetInt32().ShouldBe(1);
        EntryOf(field, "Robin Vale").GetProperty("admissionMethod").GetString().ShouldBe("automatic");
    }

    [Fact]
    public async Task With_manual_admission_an_entry_waits_until_the_owner_admits_it()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, admission: Admission.Manual);
        var field = await EnteredAsync(owner, tournament, "Robin Vale");
        var entry = EntryOf(field, "Robin Vale");
        entry.GetProperty("waitingReason").GetString().ShouldBe("admissionPending");

        var admitted = await JsonAsync(await AdmitAsync(owner, tournament, entry));

        EntryOf(admitted, "Robin Vale").GetProperty("state").GetString().ShouldBe("admitted");
        EntryOf(admitted, "Robin Vale").GetProperty("admissionMethod").GetString().ShouldBe("owner");
    }

    [Fact]
    public async Task Two_entries_racing_for_the_last_slot_do_not_both_take_it()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 1);
        var first = await GuestAsync(owner, "Robin Vale");
        var second = await GuestAsync(owner, "Sam Reed");

        var responses = await Task.WhenAll(EnterAsync(owner, tournament, first), EnterAsync(owner, tournament, second));

        responses.ShouldAllBe(response => response.StatusCode == HttpStatusCode.OK);
        var field = await FieldAsync(owner, tournament);
        field.GetProperty("admitted").GetInt32().ShouldBe(1);
        field.GetProperty("waiting").GetInt32().ShouldBe(1);
    }

    [Fact]
    public async Task Entering_needs_registration_open_and_a_guest_of_the_tournaments_kind()
    {
        var owner = await OwnerAsync();
        var closed = await TournamentAsync(owner, registration: RegistrationState.Closed);
        var teams = await TournamentAsync(owner, kind: EntryKind.Team);
        var player = await GuestAsync(owner, "Robin Vale");

        Errors(await JsonAsync(await EnterAsync(owner, closed, player)), "registration").ShouldBe(["not-open"]);
        Errors(await JsonAsync(await EnterAsync(owner, teams, player)), "guest").ShouldBe(["kind"]);
        (await FieldAsync(owner, closed)).GetProperty("entries").GetArrayLength().ShouldBe(0);
    }

    [Fact]
    public async Task A_guest_already_entered_is_refused_and_a_repeated_entry_returns_the_field()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var guest = await GuestAsync(owner, "Robin Vale");
        var entry = Guid.NewGuid();
        (await EnterAsync(owner, tournament, guest, entry)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var repeat = await EnterAsync(owner, tournament, guest, entry);
        var again = await EnterAsync(owner, tournament, guest);

        repeat.StatusCode.ShouldBe(HttpStatusCode.OK);
        Errors(await JsonAsync(again), "guest").ShouldBe(["already-entered"]);
        (await FieldAsync(owner, tournament)).GetProperty("entries").GetArrayLength().ShouldBe(1);
    }

    [Fact]
    public async Task A_cancellation_promotes_exactly_one_waiting_entry()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 2);
        var field = await EnteredAsync(owner, tournament, "Robin Vale");
        await EnteredAsync(owner, tournament, "Sam Reed");
        await EnteredAsync(owner, tournament, "Jamie Brook");
        await EnteredAsync(owner, tournament, "Taylor Finch");

        var after = await JsonAsync(await CancelAsync(owner, tournament, EntryOf(field, "Robin Vale")));

        EntryOf(after, "Robin Vale").GetProperty("state").GetString().ShouldBe("cancelled");
        EntryOf(after, "Jamie Brook").GetProperty("admissionMethod").GetString().ShouldBe("promotion");
        EntryOf(after, "Taylor Finch").GetProperty("state").GetString().ShouldBe("waiting");
        after.GetProperty("admitted").GetInt32().ShouldBe(2);
    }

    [Fact]
    public async Task Skipping_the_capacity_queue_needs_a_reason()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 1);
        var field = await EnteredAsync(owner, tournament, "Robin Vale");
        await EnteredAsync(owner, tournament, "Sam Reed");
        await EnteredAsync(owner, tournament, "Jamie Brook");
        await TournamentAsync(owner, capacity: 1, registration: RegistrationState.Closed, revision: 4, id: tournament);
        field = await JsonAsync(await CancelAsync(owner, tournament, EntryOf(field, "Robin Vale")));

        var refused = await AdmitAsync(owner, tournament, EntryOf(field, "Jamie Brook"));
        var admitted = await AdmitAsync(owner, tournament, EntryOf(field, "Jamie Brook"), "Travelled from abroad");

        Errors(await JsonAsync(refused), "reason").ShouldBe(["required"]);
        admitted.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_write_from_an_older_entry_revision_is_a_conflict_and_a_repeat_returns_the_field()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, admission: Admission.Manual);
        var entry = EntryOf(await EnteredAsync(owner, tournament, "Robin Vale"), "Robin Vale");
        (await CancelAsync(owner, tournament, entry)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var stale = await AdmitAsync(owner, tournament, entry);
        var repeat = await CancelAsync(owner, tournament, entry);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var problem = await JsonAsync(stale);
        problem.GetProperty("type").GetString().ShouldBe("entry-revision-conflict");
        problem.GetProperty("currentRevision").GetInt32().ShouldBe(2);
        repeat.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Raising_the_capacity_admits_the_first_waiting_entry_and_older_terms_change_nothing()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 1);
        await EnteredAsync(owner, tournament, "Robin Vale");
        await EnteredAsync(owner, tournament, "Sam Reed");

        await TournamentAsync(owner, capacity: 2, revision: 5, id: tournament);
        await TournamentAsync(owner, capacity: 1, registration: RegistrationState.Closed, revision: 4, id: tournament);

        var field = await FieldAsync(owner, tournament);
        field.GetProperty("terms").GetProperty("capacity").GetInt32().ShouldBe(2);
        field.GetProperty("terms").GetProperty("registration").GetString().ShouldBe("open");
        EntryOf(field, "Sam Reed").GetProperty("admissionMethod").GetString().ShouldBe("promotion");
    }

    [Fact]
    public async Task Admitted_entries_above_a_lowered_capacity_are_reported_and_block_admitting()
    {
        var owner = await OwnerAsync();
        var tournament = await TournamentAsync(owner, capacity: 2);
        await EnteredAsync(owner, tournament, "Robin Vale");
        await EnteredAsync(owner, tournament, "Sam Reed");
        await TournamentAsync(owner, capacity: 2, admission: Admission.Manual, revision: 4, id: tournament);
        var pending = EntryOf(await EnteredAsync(owner, tournament, "Jamie Brook"), "Jamie Brook");

        await TournamentAsync(owner, capacity: 1, admission: Admission.Manual, revision: 5, id: tournament);

        var field = await FieldAsync(owner, tournament);
        field.GetProperty("overCapacityBy").GetInt32().ShouldBe(1);
        field.GetProperty("admitted").GetInt32().ShouldBe(2);
        Errors(await JsonAsync(await AdmitAsync(owner, tournament, pending)), "field").ShouldBe(["mismatch"]);
    }

    [Fact]
    public async Task Another_organisations_field_and_entries_are_not_found()
    {
        var owner = await OwnerAsync();
        var other = await OwnerAsync();
        var tournament = await TournamentAsync(owner);
        var entry = EntryOf(await EnteredAsync(owner, tournament, "Robin Vale"), "Robin Vale");

        var read = await other.Client.GetAsync($"{other.Path}/tournaments/{tournament}/entries", Cancellation);
        var cancel = await CancelAsync(other, tournament, entry);
        var enter = await EnterAsync(other, tournament, await GuestAsync(other, "Sam Reed"));

        read.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        cancel.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        enter.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await FieldAsync(owner, tournament)).GetProperty("admitted").GetInt32().ShouldBe(1);
    }

    [Fact]
    public async Task A_tournament_without_terms_has_no_field()
    {
        var owner = await OwnerAsync();

        var read = await owner.Client.GetAsync($"{owner.Path}/tournaments/{Guid.NewGuid()}/entries", Cancellation);

        read.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task The_public_document_has_no_guest_or_entry_operation()
    {
        var document = await JsonAsync(await api.Anonymous().GetAsync("/openapi/public.json", Cancellation));

        document.GetProperty("paths").EnumerateObject().Select(path => path.Name)
            .ShouldNotContain(path => path.Contains("guests") || path.Contains("entries"));
    }
}
