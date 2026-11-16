using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Shouldly;

namespace Herald.Host.Tests;

// The tournament-lifecycle spec's Tournaments writes through the Admin API (h1-tournament-cancel-and-dates D-1, D-3 to D-5).
[Collection(OrganisationApiTests.Name)]
public class TournamentLifecycleTests(OrganisationApi api)
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

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) => await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private sealed record Owned(HttpClient Client, string Tournaments, Guid Id)
    {
        public string Path => $"{Tournaments}/{Id}";
    }

    // A fresh owner's tournament: published with registration open at revision 3, or a draft at revision 1.
    private async Task<Owned> TournamentAsync(bool publish = true)
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var owned = new Owned(client, $"/api/organisations/{organisation}/tournaments", Guid.NewGuid());
        (await client.PostAsJsonAsync(owned.Tournaments, new { tournamentId = owned.Id, configuration = _complete }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.Created);
        if (publish)
        {
            (await client.PostAsJsonAsync($"{owned.Path}/publication", new { expectedRevision = 1 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
            (await client.PostAsJsonAsync($"{owned.Path}/registration/opening", new { expectedRevision = 2 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        return owned;
    }

    private static Task<HttpResponseMessage> CancelAsync(Owned owned, string? reason, int expectedRevision) =>
        owned.Client.PostAsJsonAsync($"{owned.Path}/cancellation", new { reason, expectedRevision }, Cancellation);

    private static async Task<JsonElement> ReadAsync(Owned owned) => await JsonAsync(await owned.Client.GetAsync(owned.Path, Cancellation));

    [Fact]
    public async Task An_owner_cancels_once_with_a_reason_a_retry_returns_the_cancelled_tournament()
    {
        var owned = await TournamentAsync();

        var cancelled = await api.SettledAsync(() => CancelAsync(owned, "Venue unavailable", 3));
        var retried = await api.SettledAsync(() => CancelAsync(owned, "Venue unavailable", 3));

        cancelled.StatusCode.ShouldBe(HttpStatusCode.OK);
        retried.StatusCode.ShouldBe(HttpStatusCode.OK);
        var tournament = await JsonAsync(retried);
        tournament.GetProperty("competition").GetString().ShouldBe("cancelled");
        tournament.GetProperty("registration").GetString().ShouldBe("closed");
        tournament.GetProperty("revision").GetInt32().ShouldBe(4);
        var cancellation = tournament.GetProperty("cancellation");
        cancellation.GetProperty("reason").GetString().ShouldBe("Venue unavailable");
        cancellation.GetProperty("afterStart").GetBoolean().ShouldBeFalse();
    }

    [Fact]
    public async Task A_cancellation_without_a_reason_or_from_an_older_revision_changes_nothing()
    {
        var owned = await TournamentAsync();

        var unreasoned = await CancelAsync(owned, " ", 3);
        var stale = await CancelAsync(owned, "Venue unavailable", 2);

        unreasoned.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(unreasoned), "reason").ShouldBe(["required"]);
        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await ReadAsync(owned)).GetProperty("competition").GetString().ShouldBe("preparation");
    }

    [Fact]
    public async Task A_cancelled_tournament_rejects_a_late_configuration_save_and_registration_change()
    {
        var owned = await TournamentAsync();
        (await CancelAsync(owned, "Venue unavailable", 3)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var save = await owned.Client.PutAsJsonAsync(owned.Path, new { expectedRevision = 4, configuration = _complete }, Cancellation);
        var reopen = await owned.Client.PostAsJsonAsync($"{owned.Path}/registration/opening", new { expectedRevision = 4 }, Cancellation);

        save.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(save), "tournament").ShouldBe(["cancelled"]);
        reopen.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(reopen), "tournament").ShouldBe(["cancelled"]);
    }

    [Fact]
    public async Task An_archived_cancelled_tournament_leaves_the_default_list_and_comes_back_when_unarchived()
    {
        var owned = await TournamentAsync();
        var running = await TournamentAsync();
        (await CancelAsync(owned, "Venue unavailable", 3)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var archived = await api.SettledAsync(() => owned.Client.PostAsJsonAsync($"{owned.Path}/archiving", new { expectedRevision = 4 }, Cancellation));
        var refused = await running.Client.PostAsJsonAsync($"{running.Path}/archiving", new { expectedRevision = 3 }, Cancellation);
        var listed = await JsonAsync(await owned.Client.GetAsync(owned.Tournaments, Cancellation));
        var shown = await JsonAsync(await owned.Client.GetAsync($"{owned.Tournaments}?archived=true", Cancellation));
        var unarchived = await api.SettledAsync(() => owned.Client.PostAsJsonAsync($"{owned.Path}/unarchiving", new { expectedRevision = 5 }, Cancellation));

        archived.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(archived)).GetProperty("archived").GetBoolean().ShouldBeTrue();
        refused.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(refused), "archive").ShouldBe(["not-terminal"]);
        listed.GetArrayLength().ShouldBe(0);
        var entry = shown.EnumerateArray().ShouldHaveSingleItem();
        (entry.GetProperty("archived").GetBoolean(), entry.GetProperty("competition").GetString()).ShouldBe((true, "cancelled"));
        unarchived.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(await owned.Client.GetAsync(owned.Tournaments, Cancellation))).GetArrayLength().ShouldBe(1);
    }

    [Fact]
    public async Task An_owner_deletes_a_draft_and_nothing_of_it_remains()
    {
        var owned = await TournamentAsync(publish: false);

        var stale = await owned.Client.DeleteAsync($"{owned.Path}?expectedRevision=0", Cancellation);
        var deleted = await owned.Client.DeleteAsync($"{owned.Path}?expectedRevision=1", Cancellation);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        deleted.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await owned.Client.GetAsync(owned.Path, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await owned.Client.DeleteAsync($"{owned.Path}?expectedRevision=1", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task A_published_tournament_is_not_deleted()
    {
        var owned = await TournamentAsync();

        var refused = await owned.Client.DeleteAsync($"{owned.Path}?expectedRevision=3", Cancellation);

        refused.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(refused), "tournament").ShouldBe(["published"]);
    }

    [Fact]
    public async Task An_owner_postpones_the_planned_start_and_only_that_date_changes()
    {
        var owned = await TournamentAsync();

        var changed = await owned.Client.PostAsJsonAsync($"{owned.Path}/dates", new { expectedRevision = 3, plannedStartAt = "2026-11-29T10:00:00" }, Cancellation);
        var invalid = await owned.Client.PostAsJsonAsync($"{owned.Path}/dates", new { expectedRevision = 4, registrationClosesAt = "2026-11-30T10:00:00" }, Cancellation);
        var throughTheForm = await owned.Client.PutAsJsonAsync(owned.Path, new { expectedRevision = 4, configuration = _complete }, Cancellation);

        changed.StatusCode.ShouldBe(HttpStatusCode.OK);
        var configuration = (await JsonAsync(changed)).GetProperty("configuration");
        configuration.GetProperty("plannedStartAt").GetString().ShouldBe("2026-11-29T10:00:00");
        configuration.GetProperty("registrationClosesAt").GetString().ShouldBe("2026-11-13T18:00:00");
        invalid.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(invalid), "registrationClosesAt").ShouldBe(["after-planned-start"]);
        throughTheForm.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(throughTheForm), "plannedStartAt").ShouldBe(["change-dates"]);
    }

    [Fact]
    public async Task Another_organisation_cannot_cancel_archive_delete_or_change_the_dates_of_a_tournament()
    {
        var owned = await TournamentAsync();
        var other = api.As(Guid.NewGuid());

        (await other.PostAsJsonAsync($"{owned.Path}/cancellation", new { reason = "No", expectedRevision = 3 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{owned.Path}/archiving", new { expectedRevision = 3 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{owned.Path}/unarchiving", new { expectedRevision = 3 }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.PostAsJsonAsync($"{owned.Path}/dates", new { expectedRevision = 3, plannedStartAt = "2026-11-29T10:00:00" }, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await other.DeleteAsync($"{owned.Path}?expectedRevision=3", Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ReadAsync(owned)).GetProperty("competition").GetString().ShouldBe("preparation");
    }
}
