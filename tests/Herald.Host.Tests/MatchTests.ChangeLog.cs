using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// Registration's and Competition's fact events as the change log keeps them (h1-change-log D-3).
public partial class MatchTests
{
    private static async Task<List<JsonElement>> ChangeLogAsync(League league) =>
        [.. (await JsonAsync(await league.Client.GetAsync($"{league.Path}/change-log", Cancellation))).EnumerateArray()];

    private static string Kind(JsonElement entry) => entry.GetProperty("kind").GetString()!;

    [Fact]
    [Trait("covers", "change-log: Entries cancelled by the cancellation")]
    public async Task A_cancellation_is_logged_with_its_reason_and_each_entry_it_cancelled()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        await EnterAsync(league, "Jamie Brook");

        (await CancelTournamentAsync(league)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var log = await ChangeLogAsync(league);
        var cancellation = log.Single(entry => Kind(entry) == "tournamentCancelled");
        cancellation.GetProperty("reason").GetString().ShouldBe("Venue unavailable");
        cancellation.GetProperty("actorName").GetString().ShouldBe("Alex Morgan");
        var cancelled = log.Where(entry => Kind(entry) == "entryCancelled").ToList();
        cancelled.Select(entry => entry.GetProperty("alias").GetString()).Order().ShouldBe(["Jamie Brook", "Robin Vale", "Sam Reed"]);
        cancelled.ShouldAllBe(entry => entry.GetProperty("cause").GetString() == "tournament-cancelled" && !entry.GetProperty("public").GetBoolean());
        log.Count(entry => Kind(entry) == "entryAdmitted").ShouldBe(3);
    }

    [Fact]
    public async Task Admissions_and_schedule_publications_and_withdrawals_are_logged_with_who_and_no_reason()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/registration/closure", new { expectedRevision = 3 }, Cancellation));
        var drafting = Revision(await ScheduleAsync(league));
        var draft = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync(
            $"{league.Path}/schedule/draft", new { operationId = Guid.NewGuid(), seeding = "admissionOrder", expectedRevision = drafting }, Cancellation)));
        var published = await JsonAsync(await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/schedule/publication", new { expectedRevision = Revision(draft) }, Cancellation)));
        (await SettledAsync(() => league.Client.PostAsJsonAsync($"{league.Path}/schedule/withdrawal", new { reason = "Wrong seeding", expectedRevision = Revision(published) }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var log = await ChangeLogAsync(league);
        var admitted = log.Where(entry => Kind(entry) == "entryAdmitted").ToList();
        admitted.Select(entry => entry.GetProperty("alias").GetString()).Order().ShouldBe(["Robin Vale", "Sam Reed"]);
        admitted.ShouldAllBe(entry => entry.GetProperty("cause").GetString() == "automatic");
        var schedule = log.Where(entry => Kind(entry) is "schedulePublished" or "scheduleWithdrawn").ToList();
        schedule.Select(Kind).ShouldBe(["scheduleWithdrawn", "schedulePublished"]);
        schedule.ShouldAllBe(entry => entry.GetProperty("subjectRevision").GetInt32() == 1 && entry.GetProperty("actorName").GetString() == "Alex Morgan");
        schedule[0].GetProperty("reason").ValueKind.ShouldBe(JsonValueKind.Null);
    }
}
