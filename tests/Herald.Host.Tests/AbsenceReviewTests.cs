using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The absence review and the field lock through the Admin API, with terms delivered as Tournaments publishes them.
[Collection(OrganisationApiTests.Name)]
public class AbsenceReviewTests(OrganisationApi api)
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

    private Task TermsAsync(Owner owner, Guid tournament, int revision, RegistrationState registration, bool locked = false) =>
        api.PublishAndWaitAsync(new TournamentEntryTermsChanged(
            owner.Organisation, tournament, revision, registration, 4, EntryKind.Individual, Admission.Automatic, CheckIn: CheckInPolicy.Mandatory, FieldLocked: locked));

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

    private static Task<HttpResponseMessage> MarkAbsentAsync(Owner owner, Guid tournament, JsonElement entry) =>
        owner.Client.PostAsJsonAsync($"{EntryPath(owner, tournament, entry)}/absence", new { expectedRevision = entry.GetProperty("revision").GetInt32() }, Cancellation);

    [Fact]
    [Trait("covers", "entrant-check-in: The owner marks a pending entry absent")]
    public async Task The_owner_marks_a_pending_entry_absent_and_its_cause_is_shown()
    {
        var owner = await OwnerAsync();
        var tournament = Guid.NewGuid();
        await TermsAsync(owner, tournament, 3, RegistrationState.Open);
        var sam = await EnteredAsync(owner, tournament, "Sam Reed");
        await TermsAsync(owner, tournament, 4, RegistrationState.Closed);

        var response = await MarkAbsentAsync(owner, tournament, sam);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var field = await JsonAsync(response);
        var entry = EntryOf(field, "Sam Reed");
        entry.GetProperty("state").GetString().ShouldBe("cancelled");
        entry.GetProperty("cancellationCause").GetString().ShouldBe("absentAtStart");
        field.GetProperty("pending").GetInt32().ShouldBe(0);
    }

    [Fact]
    [Trait("covers", "entrant-check-in: A confirmed entry is not marked absent")]
    public async Task A_checked_in_entry_is_not_marked_absent()
    {
        var owner = await OwnerAsync();
        var tournament = Guid.NewGuid();
        await TermsAsync(owner, tournament, 3, RegistrationState.Open);
        var ana = await EnteredAsync(owner, tournament, "Ana Ruiz");
        (await owner.Client.PutAsJsonAsync($"{EntryPath(owner, tournament, ana)}/check-in", new { expectedRevision = 0 }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var response = await MarkAbsentAsync(owner, tournament, ana);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "entry").ShouldBe(["not-pending"]);
    }

    [Fact]
    [Trait("covers", "guest-entries: Cancelling after publication")]
    public async Task Cancelling_is_rejected_while_the_schedule_is_published()
    {
        var owner = await OwnerAsync();
        var tournament = Guid.NewGuid();
        await TermsAsync(owner, tournament, 3, RegistrationState.Open);
        var leo = await EnteredAsync(owner, tournament, "Leo Martín");
        await TermsAsync(owner, tournament, 4, RegistrationState.Closed, locked: true);

        var response = await owner.Client.PostAsJsonAsync($"{EntryPath(owner, tournament, leo)}/cancellation", new { expectedRevision = 1 }, Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(response), "field").ShouldBe(["schedule-published"]);
    }

    [Fact]
    public async Task Another_organisation_cannot_mark_an_entry_absent()
    {
        var owner = await OwnerAsync();
        var tournament = Guid.NewGuid();
        await TermsAsync(owner, tournament, 3, RegistrationState.Open);
        var sam = await EnteredAsync(owner, tournament, "Sam Reed");
        var other = await OwnerAsync();

        var response = await other.Client.PostAsJsonAsync(
            $"{other.Path}/tournaments/{tournament}/entries/{sam.GetProperty("id").GetGuid()}/absence", new { expectedRevision = 1 }, Cancellation);

        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
