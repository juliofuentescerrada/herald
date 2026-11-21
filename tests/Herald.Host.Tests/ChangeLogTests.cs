using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The change-log spec through the Admin API and the fact events Tournaments consumes (h1-change-log D-1 to D-3).
[Collection(OrganisationApiTests.Name)]
public class ChangeLogTests(OrganisationApi api)
{
    private static readonly object _complete = new
    {
        title = "Saturday Open",
        gameVariant = "Example strategy · Standard variant",
        entryKind = "individual",
        capacity = 8,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-13T18:00:00",
        plannedStartAt = "2026-11-22T10:00:00",
        timeZone = "Europe/Madrid",
        location = "onSite",
        venue = "Madrid",
        admission = "manual",
        checkIn = "mandatory",
        visibility = "public",
    };

    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Owned(HttpClient Client, Guid Organisation, Guid Id)
    {
        public string Path => $"/api/organisations/{Organisation}/tournaments/{Id}";
    }

    // A fresh owner's tournament, published at revision 2.
    private async Task<Owned> PublishedAsync()
    {
        var client = api.As(Guid.NewGuid());
        var owned = new Owned(client, Guid.NewGuid(), Guid.NewGuid());
        (await client.CreateAsync(owned.Organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        (await client.PostAsJsonAsync($"/api/organisations/{owned.Organisation}/tournaments", new { tournamentId = owned.Id, configuration = _complete }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
        (await client.PostAsJsonAsync($"{owned.Path}/publication", new { expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        return owned;
    }

    private static async Task<JsonElement[]> LogAsync(Owned owned)
    {
        var response = await owned.Client.GetAsync($"{owned.Path}/change-log", Cancellation);
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        return [.. (await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation)).EnumerateArray()];
    }

    [Fact]
    [Trait("covers", "change-log: A postponed start")]
    public async Task A_postponed_start_is_listed_first_with_its_old_and_new_times_and_the_owner()
    {
        var owned = await PublishedAsync();

        (await owned.Client.PostAsJsonAsync($"{owned.Path}/dates", new { expectedRevision = 2, plannedStartAt = "2026-11-29T10:00:00" }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var log = await LogAsync(owned);
        log.Select(entry => entry.GetProperty("kind").GetString()).ShouldBe(["datesChanged", "tournamentPublished"]);
        var dates = log[0];
        dates.GetProperty("actorName").GetString().ShouldBe("Alex Morgan");
        dates.GetProperty("timeZone").GetString().ShouldBe("Europe/Madrid");
        dates.GetProperty("public").GetBoolean().ShouldBeTrue();
        var change = dates.GetProperty("changes").EnumerateArray().Single();
        change.GetProperty("field").GetString().ShouldBe("plannedStartAt");
        change.GetProperty("old").GetString().ShouldBe("2026-11-22T10:00:00");
        change.GetProperty("new").GetString().ShouldBe("2026-11-29T10:00:00");
    }

    [Fact]
    [Trait("covers", "change-log: A repeated fact")]
    public async Task A_schedule_publication_delivered_twice_is_listed_once()
    {
        var owned = await PublishedAsync();
        var published = new SchedulePublished(owned.Organisation, owned.Id, 2, Guid.NewGuid(), "Alex Morgan", DateTimeOffset.UtcNow);

        await api.PublishAndWaitAsync(published);
        await api.PublishAndWaitAsync(published);

        var schedule = (await LogAsync(owned)).Where(entry => entry.GetProperty("kind").GetString() == "schedulePublished").ToList();
        schedule.Count.ShouldBe(1);
        schedule[0].GetProperty("subjectRevision").GetInt32().ShouldBe(2);
        schedule[0].GetProperty("public").GetBoolean().ShouldBeFalse();
    }

    [Fact]
    public async Task Another_organisations_change_log_is_not_found()
    {
        var owned = await PublishedAsync();
        var stranger = api.As(Guid.NewGuid());
        (await stranger.CreateAsync(Guid.NewGuid(), "Eastside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);

        (await stranger.GetAsync($"{owned.Path}/change-log", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
