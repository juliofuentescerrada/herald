using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The tournament's cancellation as Registration and Competition apply it (h1-tournament-cancel-and-dates D-1, D-3).
public partial class MatchTests
{
    private async Task<HttpResponseMessage> CancelTournamentAsync(League league, string reason = "Venue unavailable") =>
        await SettledAsync(async () => await league.Client.PostAsJsonAsync(
            $"{league.Path}/cancellation", new { reason, expectedRevision = Revision(await JsonAsync(await league.Client.GetAsync(league.Path, Cancellation))) }, Cancellation));

    private static async Task<JsonElement> FieldAsync(League league) => await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries", Cancellation));

    [Fact]
    public async Task A_cancellation_before_start_cancels_every_entry_and_rejects_a_late_entry()
    {
        var league = await OpenAsync("individual");
        await EnterAsync(league, "Robin Vale");
        await EnterAsync(league, "Sam Reed");
        var tournament = Guid.Parse(league.Path.Split('/')[^1]);

        (await CancelTournamentAsync(league)).StatusCode.ShouldBe(HttpStatusCode.OK);
        var guest = await GuestAsync(league, "Alex Kim", "player");
        var late = await league.Client.PutAsJsonAsync($"{league.Path}/entries/{Guid.NewGuid()}", new { guestId = guest }, Cancellation);

        api.Sent<TournamentCancelled>().Where(message => message.TournamentId == tournament).Distinct().ShouldHaveSingleItem().AfterStart.ShouldBeFalse();
        var entries = (await FieldAsync(league)).GetProperty("entries").EnumerateArray().ToList();
        entries.Count.ShouldBe(2);
        entries.ShouldAllBe(entry => entry.GetProperty("state").GetString() == "cancelled" && entry.GetProperty("cancellationCause").GetString() == "tournamentCancelled");
        late.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(late), "tournament").ShouldBe(["cancelled"]);
    }
}
