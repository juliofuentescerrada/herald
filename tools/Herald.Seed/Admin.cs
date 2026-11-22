using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Testing;

namespace Herald.Seed;

// The admin API as one persona sees it. Every write waits until the messages it caused have been handled.
public sealed class Admin(Seeding seeding, Persona persona)
{
    private readonly HttpClient _client = Client(seeding, persona);

    public Persona Persona => persona;

    public async Task<IReadOnlyList<Guid>> OwnedOrganisationsAsync()
    {
        var me = await ReadAsync(await _client.GetAsync("/api/me"), "read the signed-in person");
        return [.. me.GetProperty("organisations").EnumerateArray().Select(organisation => organisation.GetProperty("id").GetGuid())];
    }

    public Task CreateOrganisationAsync(Guid id, string name) =>
        WriteAsync($"create organisation '{name}'", () => _client.PostAsJsonAsync("/api/organisations", new { organisationId = id, name }));

    public Task CreateTournamentAsync(Guid organisation, Guid id, object configuration) =>
        WriteAsync($"create tournament {id}", () => _client.PostAsJsonAsync($"/api/organisations/{organisation}/tournaments", new { tournamentId = id, configuration }));

    public async Task PublishAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"publish tournament {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/publication", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task OpenRegistrationAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"open registration of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/registration/opening", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task CloseRegistrationAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"close registration of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/registration/closure", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task<Guid> CreateGuestAsync(Guid organisation, string kind, string name)
    {
        var id = Ids.For(organisation.ToString(), kind, name);
        await WriteAsync($"create guest '{name}'", () =>
            _client.PutAsJsonAsync($"/api/organisations/{organisation}/guests/{id}", new { kind, name, confirmNew = true }));
        return id;
    }

    public async Task<Guid> EnterAsync(Guid organisation, Guid tournament, Guid guest)
    {
        var entry = Ids.For(tournament.ToString(), "entry", guest.ToString());
        await WriteAsync($"enter guest {guest}", () => _client.PutAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}", new { guestId = guest }));
        return entry;
    }

    // A pilot application's grant (pilot-access); tournaments null covers all of them.
    public async Task<Guid> GrantAsync(Guid organisation, string name, Guid application, Guid[]? tournaments, params string[] groups)
    {
        var id = Ids.For(organisation.ToString(), "grant", name);
        await WriteAsync($"grant '{name}'", () => _client.PutAsJsonAsync(
            $"/api/organisations/{organisation}/applications/{id}", new { name, applicationId = application, tournaments, groups }));
        return id;
    }

    public Task RevokeAsync(Guid organisation, Guid grant) =>
        WriteAsync($"revoke grant {grant}", () => _client.PostAsync($"/api/organisations/{organisation}/applications/{grant}/revocation", null));

    public async Task CancelAsync(Guid organisation, Guid tournament, Guid entry) =>
        await WriteAsync($"cancel entry {entry}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}/cancellation", new { expectedRevision = await EntryRevisionAsync(organisation, tournament, entry) }));

    public async Task CheckInAsync(Guid organisation, Guid tournament, Guid entry) =>
        await WriteAsync($"check in entry {entry}", async () =>
            await _client.PutAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}/check-in", new { expectedRevision = await EntryRevisionAsync(organisation, tournament, entry, "checkInRevision") }));

    public async Task AddRosterMemberAsync(Guid organisation, Guid tournament, Guid entry, Guid player)
    {
        var roster = $"{Path(organisation, tournament)}/entries/{entry}/roster";
        await WriteAsync($"add player {player} to the roster of {entry}", async () =>
        {
            var revision = (await ReadAsync(await _client.GetAsync(roster), "read a roster")).GetProperty("revision").GetInt32();
            return await _client.PutAsJsonAsync($"{roster}/members/{player}", new { expectedRevision = revision });
        });
    }

    // Drafts in admission order and publishes it; the operation identifier is stable, so a rerun repeats.
    public async Task PublishScheduleAsync(Guid organisation, Guid tournament)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        await WriteAsync($"draft the schedule of {tournament}", async () => await _client.PostAsJsonAsync($"{schedule}/draft", new
        {
            operationId = Ids.For(tournament.ToString(), "draft"),
            expectedRevision = (await ReadAsync(await _client.GetAsync(schedule), "read a schedule")).GetProperty("revision").GetInt32(),
            seeding = "admissionOrder",
        }));
        await PublishDraftAsync(organisation, tournament);
    }

    // Publishes the current draft, such as the one a withdrawal returned.
    public async Task PublishDraftAsync(Guid organisation, Guid tournament)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        await WriteAsync($"publish the schedule of {tournament}", async () => await _client.PostAsJsonAsync($"{schedule}/publication", new
        {
            expectedRevision = (await ReadAsync(await _client.GetAsync(schedule), "read a schedule")).GetProperty("revision").GetInt32(),
        }));
    }

    // Withdraws the published schedule with a private reason; its pairings come back as the draft.
    public async Task WithdrawScheduleAsync(Guid organisation, Guid tournament, string reason)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        await WriteAsync($"withdraw the schedule of {tournament}", async () => await _client.PostAsJsonAsync($"{schedule}/withdrawal", new
        {
            reason,
            expectedRevision = (await ReadAsync(await _client.GetAsync(schedule), "read a schedule")).GetProperty("revision").GetInt32(),
        }));
    }

    // Moves the planned start of a published tournament through "Change dates" (h1-tournament-cancel-and-dates D-5).
    public async Task ChangePlannedStartAsync(Guid organisation, Guid tournament, object plannedStartAt) =>
        await WriteAsync($"change the dates of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/dates", new { plannedStartAt, expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task StartCompetitionAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"start the competition of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/competition/start", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    // Records the result of the schedule's match at that position, played or with another cause (h1-exceptional-outcomes);
    // the operation identifier is stable, so a rerun repeats.
    public async Task RecordResultAsync(
        Guid organisation, Guid tournament, int index, string cause = "played", string? outcome = null, string? entrant = null, bool? played = null, string? reason = null)
    {
        var schedule = await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/schedule"), "read a schedule");
        var match = schedule.GetProperty("matches")[index].GetProperty("matchId").GetGuid();
        var path = $"{Path(organisation, tournament)}/matches/{match}";
        await WriteAsync($"record the result of {match}", async () => await _client.PostAsJsonAsync($"{path}/result", new
        {
            operationId = Ids.For(match.ToString(), "result"),
            expectedRevision = (await ReadAsync(await _client.GetAsync(path), "read a match")).GetProperty("revision").GetInt32(),
            cause,
            outcome,
            entrant,
            played,
            reason,
        }));
    }

    // The match between two named entrants, won by the first named.
    public async Task RecordWinAsync(Guid organisation, Guid tournament, string winner, string loser)
    {
        var schedule = await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/schedule"), "read a schedule");
        var match = schedule.GetProperty("matches").EnumerateArray().Single(candidate =>
            new[] { Name(candidate, "first"), Name(candidate, "second") }.Order().SequenceEqual(new[] { winner, loser }.Order()));
        var id = match.GetProperty("matchId").GetGuid();
        var path = $"{Path(organisation, tournament)}/matches/{id}";
        await WriteAsync($"record the result of {id}", async () => await _client.PostAsJsonAsync($"{path}/result", new
        {
            operationId = Ids.For(id.ToString(), "result"),
            expectedRevision = (await ReadAsync(await _client.GetAsync(path), "read a match")).GetProperty("revision").GetInt32(),
            outcome = Name(match, "first") == winner ? "first" : "second",
        }));
    }

    // Corrects the resolved match between two named entrants to a played draw, with the correction's reason (h1-safe-corrections).
    public async Task CorrectToDrawAsync(Guid organisation, Guid tournament, string first, string second, string reason)
    {
        var schedule = await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/schedule"), "read a schedule");
        var id = schedule.GetProperty("matches").EnumerateArray().Single(candidate =>
            new[] { Name(candidate, "first"), Name(candidate, "second") }.Order().SequenceEqual(new[] { first, second }.Order())).GetProperty("matchId").GetGuid();
        var path = $"{Path(organisation, tournament)}/matches/{id}";
        await WriteAsync($"correct the result of {id}", async () => await _client.PostAsJsonAsync($"{path}/result/correction", new
        {
            operationId = Ids.For(id.ToString(), "correction"),
            expectedRevision = (await ReadAsync(await _client.GetAsync(path), "read a match")).GetProperty("revision").GetInt32(),
            cause = "played",
            outcome = "draw",
            correctionReason = reason,
        }));
    }

    // Finalises the competition at its current results revision, which the settled seeding has already applied to the standings
    // (h1-finalisation); a rerun repeats.
    public async Task FinaliseAsync(Guid organisation, Guid tournament)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        await WriteAsync($"finalise {tournament}", async () =>
        {
            var details = await ReadAsync(await _client.GetAsync(schedule), "read a schedule");
            return await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/finalisation", new
            {
                reviewedRevision = details.GetProperty("resultsRevision").GetInt32(),
                expectedRevision = details.GetProperty("revision").GetInt32(),
            });
        });
    }

    // Cancels the tournament for good with a private reason (h1-tournament-cancel-and-dates); a rerun repeats.
    public async Task CancelTournamentAsync(Guid organisation, Guid tournament, string reason) =>
        await WriteAsync($"cancel tournament {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/cancellation", new { reason, expectedRevision = await RevisionAsync(organisation, tournament) }));

    // Public, unlisted or private from publication on (h1-public-read D-3); a rerun repeats.
    public async Task ChangeVisibilityAsync(Guid organisation, Guid tournament, string visibility) =>
        await WriteAsync($"change visibility of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/visibility", new { visibility, expectedRevision = await RevisionAsync(organisation, tournament) }));

    // Hides a finalised or cancelled tournament from the default list (h1-tournament-cancel-and-dates D-3).
    public async Task ArchiveAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"archive tournament {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/archiving", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    // Records a side's lineup of the schedule's match at that position from its frozen roster's first players (h1-match-lineups).
    public async Task RecordLineupAsync(Guid organisation, Guid tournament, int index, string side, int players)
    {
        var schedule = await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/schedule"), "read a schedule");
        var match = schedule.GetProperty("matches")[index].GetProperty("matchId").GetGuid();
        var path = $"{Path(organisation, tournament)}/matches/{match}";
        await WriteAsync($"record the {side} lineup of {match}", async () =>
        {
            var details = await ReadAsync(await _client.GetAsync(path), "read a match");
            var roster = details.GetProperty(side).GetProperty("roster").EnumerateArray().Select(player => player.GetProperty("playerId").GetGuid()).Take(players);
            return await _client.PutAsJsonAsync($"{path}/lineups/{side}", new { expectedRevision = details.GetProperty("revision").GetInt32(), players = roster });
        });
    }

    // Withdraws a named entrant of the running competition; the operation identifier is stable, so a rerun repeats (h1-round-operations).
    public async Task WithdrawEntrantAsync(Guid organisation, Guid tournament, string name, string reason)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        var entry = EntrantOf(await ReadAsync(await _client.GetAsync(schedule), "read a schedule"), name).GetProperty("entryId").GetGuid();
        await WriteAsync($"withdraw {entry}", async () => await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/entrants/{entry}/withdrawal", new
        {
            operationId = Ids.For(entry.ToString(), "withdrawal"),
            expectedRevision = (await ReadAsync(await _client.GetAsync(schedule), "read a schedule")).GetProperty("revision").GetInt32(),
            reason,
        }));
    }

    // Sanctions a named player of a named team's frozen roster (h1-round-operations); a rerun repeats.
    public async Task SanctionPlayerAsync(Guid organisation, Guid tournament, string team, string player, string reason)
    {
        var schedule = $"{Path(organisation, tournament)}/schedule";
        var entrant = EntrantOf(await ReadAsync(await _client.GetAsync(schedule), "read a schedule"), team);
        var id = entrant.GetProperty("roster").EnumerateArray().Single(candidate => candidate.GetProperty("name").GetString() == player).GetProperty("playerId").GetGuid();
        await WriteAsync($"sanction {id}", async () => await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/entrants/{entrant.GetProperty("entryId").GetGuid()}/players/{id}/sanction", new
        {
            expectedRevision = (await ReadAsync(await _client.GetAsync(schedule), "read a schedule")).GetProperty("revision").GetInt32(),
            reason,
        }));
    }

    private static JsonElement EntrantOf(JsonElement schedule, string name) =>
        schedule.GetProperty("entrants").EnumerateArray().Single(entrant => entrant.GetProperty("name").GetString() == name);

    private static string Name(JsonElement match, string side) => match.GetProperty(side).GetProperty("name").GetString()!;

    private static string Path(Guid organisation, Guid tournament) => $"/api/organisations/{organisation}/tournaments/{tournament}";

    private async Task<int> RevisionAsync(Guid organisation, Guid tournament) =>
        (await ReadAsync(await _client.GetAsync(Path(organisation, tournament)), "read a tournament")).GetProperty("revision").GetInt32();

    private async Task<int> EntryRevisionAsync(Guid organisation, Guid tournament, Guid entry, string revision = "revision") =>
        (await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/entries"), "read a field"))
            .GetProperty("entries").EnumerateArray().Single(candidate => candidate.GetProperty("id").GetGuid() == entry)
            .GetProperty(revision).GetInt32();

    private async Task WriteAsync(string step, Func<Task<HttpResponseMessage>> request)
    {
        using var response = await seeding.SettledAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new SeedStepException(step, response.StatusCode, await response.Content.ReadAsStringAsync());
        }
    }

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage response, string step)
    {
        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new SeedStepException(step, response.StatusCode, await response.Content.ReadAsStringAsync());
            }

            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }
    }

    private static HttpClient Client(Seeding seeding, Persona persona)
    {
        var client = seeding.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", TestTokens.WithIdentifiers(persona.DirectoryId.ToString(), persona.ObjectId.ToString(), persona.Name));
        return client;
    }
}

public sealed class SeedStepException(string step, System.Net.HttpStatusCode status, string body)
    : Exception($"Could not {step}: {(int)status} {status}. {body}");
