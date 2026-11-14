using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The lock travels as it does in production: Competition reports the schedule, Tournaments sends Registration new
// terms, and Registration refuses field changes until the schedule is withdrawn (h1-round-robin-pairings D-3, D-4).
[Collection(OrganisationApiTests.Name)]
public class ScheduleLockTests(OrganisationApi api)
{
    private static readonly object _league = new
    {
        title = "Friday League",
        gameVariant = "Example strategy · Standard variant",
        entryKind = "individual",
        capacity = 8,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-13T18:00:00",
        plannedStartAt = "2026-11-14T10:00:00",
        timeZone = "Europe/Madrid",
        location = "onSite",
        venue = "Madrid",
        admission = "automatic",
        checkIn = "optional",
        visibility = "public",
    };

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private static int Revision(JsonElement element) => element.GetProperty("revision").GetInt32();

    [Fact]
    [Trait("covers", "guest-entries: Cancelling after publication")]
    [Trait("covers", "guest-entries: After withdrawal")]
    [Trait("covers", "registration-window: Reopening a published schedule's tournament")]
    public async Task A_published_schedule_locks_the_field_and_reopening_until_it_is_withdrawn()
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var path = $"/api/organisations/{organisation}";
        var id = Guid.NewGuid();
        var tournament = $"{path}/tournaments/{id}";
        (await client.PostAsJsonAsync($"{path}/tournaments", new { tournamentId = id, configuration = _league }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Created);
        await api.SettledAsync(() => client.PostAsJsonAsync($"{tournament}/publication", new { expectedRevision = 1 }, Cancellation));
        await api.SettledAsync(() => client.PostAsJsonAsync($"{tournament}/registration/opening", new { expectedRevision = 2 }, Cancellation));
        var entries = new List<JsonElement>();
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook" })
        {
            var guest = Guid.NewGuid();
            await client.PutAsJsonAsync($"{path}/guests/{guest}", new { kind = "player", name, confirmNew = true }, Cancellation);
            var entered = await JsonAsync(await api.SettledAsync(() => client.PutAsJsonAsync($"{tournament}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation)));
            entries.Add(entered.GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("guestName").GetString() == name));
        }

        await api.SettledAsync(() => client.PostAsJsonAsync($"{tournament}/registration/closure", new { expectedRevision = 3 }, Cancellation));
        var schedule = await JsonAsync(await client.GetAsync($"{tournament}/schedule", Cancellation));
        var draft = await JsonAsync(await api.SettledAsync(() => client.PostAsJsonAsync(
            $"{tournament}/schedule/draft", new { operationId = Guid.NewGuid(), expectedRevision = Revision(schedule), seeding = "admissionOrder" }, Cancellation)));
        var published = await JsonAsync(await api.SettledAsync(() => client.PostAsJsonAsync($"{tournament}/schedule/publication", new { expectedRevision = Revision(draft) }, Cancellation)));
        var sam = $"{tournament}/entries/{entries[1].GetProperty("id").GetGuid()}/cancellation";

        var cancelled = await client.PostAsJsonAsync(sam, new { expectedRevision = 1 }, Cancellation);
        var details = await JsonAsync(await client.GetAsync(tournament, Cancellation));
        var reopened = await client.PostAsJsonAsync($"{tournament}/registration/opening", new { expectedRevision = Revision(details) }, Cancellation);

        cancelled.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(cancelled), "field").ShouldBe(["schedule-published"]);
        details.GetProperty("schedulePublished").GetBoolean().ShouldBeTrue();
        reopened.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(reopened), "registration").ShouldBe(["schedule-published"]);

        await api.SettledAsync(() => client.PostAsJsonAsync($"{tournament}/schedule/withdrawal", new { expectedRevision = Revision(published), reason = "Late absence" }, Cancellation));
        var field = await JsonAsync(await client.GetAsync($"{tournament}/entries", Cancellation));
        var after = await client.PostAsJsonAsync(sam, new { expectedRevision = 1 }, Cancellation);

        field.GetProperty("terms").GetProperty("fieldLocked").GetBoolean().ShouldBeFalse();
        after.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
