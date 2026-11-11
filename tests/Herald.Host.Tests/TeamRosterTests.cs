using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Host.Tests;

// The team-rosters spec through the Admin API, with Tournaments publishing the roster sizes.
[Collection(OrganisationApiTests.Name)]
public class TeamRosterTests(OrganisationApi api)
{
    private static CancellationToken Cancellation => TestContext.Current.CancellationToken;

    private sealed record Tournament(HttpClient Client, string Organisation, Guid Id)
    {
        public string Path => $"{Organisation}/tournaments/{Id}";
    }

    private sealed record Team(Tournament Tournament, Guid EntryId)
    {
        public string Roster => $"{Tournament.Path}/entries/{EntryId}/roster";
    }

    private static object Configuration(string entryKind = "team", int maximumRosterSize = 5) => new
    {
        title = "Saturday Team League",
        gameVariant = "Example strategy · Standard variant",
        entryKind,
        capacity = 4,
        registrationOpensAt = "2026-11-10T09:00:00",
        registrationClosesAt = "2026-11-27T18:00:00",
        plannedStartAt = "2026-11-28T10:00:00",
        timeZone = "Europe/Madrid",
        location = "online",
        admission = "automatic",
        checkIn = "optional",
        visibility = "public",
        minimumRosterSize = entryKind == "team" ? 3 : (int?)null,
        maximumRosterSize = entryKind == "team" ? maximumRosterSize : (int?)null,
        activePlayersPerSide = entryKind == "team" ? 2 : (int?)null,
    };

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>(Cancellation);

    private static string[] Errors(JsonElement problem, string field) =>
        [.. problem.GetProperty("errors").GetProperty(field).EnumerateArray().Select(value => value.GetString()!)];

    private static string[] Members(JsonElement roster) =>
        [.. roster.GetProperty("members").EnumerateArray().Select(member => member.GetProperty("name").GetString()!)];

    private Task<HttpResponseMessage> SettledAsync(Func<Task<HttpResponseMessage>> request) => api.SettledAsync(request);

    private async Task<Tournament> OpenTournamentAsync(string entryKind = "team", HttpClient? client = null)
    {
        client ??= api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var tournament = new Tournament(client, $"/api/organisations/{organisation}", Guid.NewGuid());
        (await client.PostAsJsonAsync($"{tournament.Organisation}/tournaments", new { tournamentId = tournament.Id, configuration = Configuration(entryKind) }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
        (await SettledAsync(() => client.PostAsJsonAsync($"{tournament.Path}/publication", new { expectedRevision = 1 }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await SettledAsync(() => client.PostAsJsonAsync($"{tournament.Path}/registration/opening", new { expectedRevision = 2 }, Cancellation))).StatusCode.ShouldBe(HttpStatusCode.OK);
        return tournament;
    }

    private static async Task<Guid> GuestAsync(Tournament tournament, string name, string kind = "player")
    {
        var guest = Guid.NewGuid();
        (await tournament.Client.PutAsJsonAsync($"{tournament.Organisation}/guests/{guest}", new { kind, name, confirmNew = true }, Cancellation))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        return guest;
    }

    private async Task<Team> EnterAsync(Tournament tournament, string name, string kind = "team")
    {
        var guest = await GuestAsync(tournament, name, kind);
        var entry = Guid.NewGuid();
        (await SettledAsync(() => tournament.Client.PutAsJsonAsync($"{tournament.Path}/entries/{entry}", new { guestId = guest }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);
        return new(tournament, entry);
    }

    private static async Task<JsonElement> RosterAsync(Team team) => await JsonAsync(await team.Tournament.Client.GetAsync(team.Roster, Cancellation));

    private static async Task<HttpResponseMessage> AddAsync(Team team, Guid guest, int? expectedRevision = null) =>
        await team.Tournament.Client.PutAsJsonAsync(
            $"{team.Roster}/members/{guest}",
            new { expectedRevision = expectedRevision ?? (await RosterAsync(team)).GetProperty("revision").GetInt32() },
            Cancellation);

    private static async Task<HttpResponseMessage> RemoveAsync(Team team, Guid guest, int? expectedRevision = null) =>
        await team.Tournament.Client.DeleteAsync(
            $"{team.Roster}/members/{guest}?expectedRevision={expectedRevision ?? (await RosterAsync(team)).GetProperty("revision").GetInt32()}",
            Cancellation);

    private static async Task<Guid> AddNewAsync(Team team, string name)
    {
        var guest = await GuestAsync(team.Tournament, name);
        (await AddAsync(team, guest)).StatusCode.ShouldBe(HttpStatusCode.OK);
        return guest;
    }

    private static async Task<JsonElement> EntryAsync(Team team) =>
        (await JsonAsync(await team.Tournament.Client.GetAsync($"{team.Tournament.Path}/entries", Cancellation)))
            .GetProperty("entries").EnumerateArray().Single(entry => entry.GetProperty("id").GetGuid() == team.EntryId);

    [Fact]
    public async Task An_owner_builds_a_roster_to_its_minimum_and_the_field_reports_it_complete()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        await AddNewAsync(team, "Robin Vale");
        await AddNewAsync(team, "Sam Reed");

        (await EntryAsync(team)).GetProperty("rosterReadiness").GetString().ShouldBe("incomplete");
        await AddNewAsync(team, "Jamie Brook");

        var roster = await RosterAsync(team);
        Members(roster).ShouldBe(["Robin Vale", "Sam Reed", "Jamie Brook"]);
        roster.GetProperty("readiness").GetString().ShouldBe("complete");
        roster.GetProperty("minimumRosterSize").GetInt32().ShouldBe(3);
        roster.GetProperty("maximumRosterSize").GetInt32().ShouldBe(5);
        var entry = await EntryAsync(team);
        entry.GetProperty("rosterSize").GetInt32().ShouldBe(3);
        entry.GetProperty("rosterRevision").GetInt32().ShouldBe(3);
        entry.GetProperty("rosterReadiness").GetString().ShouldBe("complete");
    }

    [Fact]
    public async Task A_player_on_another_teams_roster_is_refused_with_that_team()
    {
        var tournament = await OpenTournamentAsync();
        var teamA = await EnterAsync(tournament, "Team A");
        var teamB = await EnterAsync(tournament, "Team B");
        var ana = await AddNewAsync(teamA, "Ana Ruiz");

        var response = await AddAsync(teamB, ana);

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        var problem = await JsonAsync(response);
        Errors(problem, "guestId").ShouldBe(["on-another-team"]);
        problem.GetProperty("team").GetProperty("name").GetString().ShouldBe("Team A");
        problem.GetProperty("team").GetProperty("entryId").GetGuid().ShouldBe(teamA.EntryId);
        Members(await RosterAsync(teamB)).ShouldBeEmpty();
        var found = await JsonAsync(await tournament.Client.GetAsync($"{tournament.Organisation}/guests?kind=player&name=ana&tournamentId={tournament.Id}", Cancellation));
        found.EnumerateArray().Single().GetProperty("team").GetProperty("name").GetString().ShouldBe("Team A");
    }

    [Fact]
    public async Task Two_simultaneous_additions_of_one_player_to_two_teams_leave_them_on_one()
    {
        var tournament = await OpenTournamentAsync();
        var teamA = await EnterAsync(tournament, "Team A");
        var teamB = await EnterAsync(tournament, "Team B");
        var ana = await GuestAsync(tournament, "Ana Ruiz");

        var responses = await Task.WhenAll(AddAsync(teamA, ana, 0), AddAsync(teamB, ana, 0));

        responses.Select(response => response.StatusCode).Order().ShouldBe([HttpStatusCode.OK, HttpStatusCode.BadRequest]);
        (Members(await RosterAsync(teamA)).Length + Members(await RosterAsync(teamB)).Length).ShouldBe(1);
    }

    [Fact]
    public async Task A_full_roster_and_a_guest_team_are_rejected()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch", "Casey Wood" })
        {
            await AddNewAsync(team, name);
        }

        var full = await AddAsync(team, await GuestAsync(tournament, "Parker Snow"));
        var guestTeam = await AddAsync(team, await GuestAsync(tournament, "Cedar Owls", "team"));

        Errors(await JsonAsync(full), "roster").ShouldBe(["full"]);
        Errors(await JsonAsync(guestTeam), "guestId").ShouldBe(["not-a-player"]);
        Members(await RosterAsync(team)).Length.ShouldBe(5);
    }

    [Fact]
    public async Task A_removal_is_kept_in_the_history_and_an_older_revision_conflicts()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        var ana = await AddNewAsync(team, "Ana Ruiz");

        (await RemoveAsync(team, ana)).StatusCode.ShouldBe(HttpStatusCode.OK);
        var stale = await AddAsync(team, await GuestAsync(tournament, "Sam Reed"), expectedRevision: 1);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var conflict = await JsonAsync(stale);
        conflict.GetProperty("type").GetString().ShouldBe("roster-revision-conflict");
        conflict.GetProperty("currentRevision").GetInt32().ShouldBe(2);
        var roster = await RosterAsync(team);
        Members(roster).ShouldBeEmpty();
        roster.GetProperty("revision").GetInt32().ShouldBe(2);
        roster.GetProperty("history").EnumerateArray().Select(change => (change.GetProperty("name").GetString(), change.GetProperty("kind").GetString()))
            .ShouldBe([("Ana Ruiz", "added"), ("Ana Ruiz", "removed")]);
        (await RemoveAsync(team, ana, expectedRevision: 0)).StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_cancelled_team_releases_its_players_and_its_roster_is_fixed()
    {
        var tournament = await OpenTournamentAsync();
        var teamA = await EnterAsync(tournament, "Team A");
        var teamB = await EnterAsync(tournament, "Team B");
        var ana = await AddNewAsync(teamA, "Ana Ruiz");
        var entry = await EntryAsync(teamA);
        (await SettledAsync(() => tournament.Client.PostAsJsonAsync(
            $"{tournament.Path}/entries/{teamA.EntryId}/cancellation", new { expectedRevision = entry.GetProperty("revision").GetInt32() }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        (await AddAsync(teamB, ana)).StatusCode.ShouldBe(HttpStatusCode.OK);
        var fixedRoster = await AddAsync(teamA, await GuestAsync(tournament, "Sam Reed"));

        Errors(await JsonAsync(fixedRoster), "entry").ShouldBe(["cancelled"]);
        Members(await RosterAsync(teamA)).ShouldBe(["Ana Ruiz"]);
    }

    [Fact]
    public async Task Different_guests_with_the_same_name_on_two_teams_are_flagged()
    {
        var tournament = await OpenTournamentAsync();
        var teamA = await EnterAsync(tournament, "Team A");
        var teamB = await EnterAsync(tournament, "Team B");
        await AddNewAsync(teamA, "Ana Ruiz");

        await AddNewAsync(teamB, "ana  ruíz");

        (await RosterAsync(teamB)).GetProperty("members")[0].GetProperty("possibleDuplicateOf").GetProperty("name").GetString().ShouldBe("Team A");
        (await RosterAsync(teamA)).GetProperty("members")[0].GetProperty("possibleDuplicateOf").GetProperty("name").GetString().ShouldBe("Team B");
    }

    [Fact]
    public async Task A_lowered_maximum_reaches_the_field_and_keeps_every_member()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        foreach (var name in new[] { "Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch", "Casey Wood" })
        {
            await AddNewAsync(team, name);
        }

        var read = await JsonAsync(await tournament.Client.GetAsync(tournament.Path, Cancellation));
        (await SettledAsync(() => tournament.Client.PutAsJsonAsync(
            tournament.Path, new { expectedRevision = read.GetProperty("revision").GetInt32(), configuration = Configuration(maximumRosterSize: 4) }, Cancellation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var roster = await RosterAsync(team);
        roster.GetProperty("maximumRosterSize").GetInt32().ShouldBe(4);
        roster.GetProperty("readiness").GetString().ShouldBe("aboveMaximum");
        Members(roster).Length.ShouldBe(5);
    }

    [Fact]
    public async Task Rosters_wait_for_terms_with_roster_sizes()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        var organisation = Guid.Parse(tournament.Organisation.Split('/')[^1]);

        // A version 1 message sent before roster sizes existed, newer than anything published so far.
        await api.PublishAndWaitAsync(new TournamentEntryTermsChanged(organisation, tournament.Id, 100, RegistrationState.Open, 4, EntryKind.Team, Admission.Automatic));

        (await RosterAsync(team)).GetProperty("readiness").GetString().ShouldBe("awaitingTerms");
        Errors(await JsonAsync(await AddAsync(team, await GuestAsync(tournament, "Sam Reed"))), "roster").ShouldBe(["awaiting-terms"]);
    }

    [Fact]
    public async Task An_individual_tournament_has_no_rosters()
    {
        var tournament = await OpenTournamentAsync(entryKind: "individual");
        var entry = await EnterAsync(tournament, "Robin Vale", kind: "player");

        (await tournament.Client.GetAsync(entry.Roster, Cancellation)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        var write = await entry.Tournament.Client.PutAsJsonAsync($"{entry.Roster}/members/{await GuestAsync(tournament, "Sam Reed")}", new { expectedRevision = 0 }, Cancellation);
        Errors(await JsonAsync(write), "entry").ShouldBe(["not-team-tournament"]);
        var row = await EntryAsync(entry);
        (!row.TryGetProperty("rosterReadiness", out var readiness) || readiness.ValueKind == JsonValueKind.Null).ShouldBeTrue();
    }

    [Fact]
    public async Task Another_organisations_owner_gets_the_generic_not_found()
    {
        var tournament = await OpenTournamentAsync();
        var team = await EnterAsync(tournament, "River Falcons");
        var ana = await GuestAsync(tournament, "Ana Ruiz");
        var other = await OpenTournamentAsync();

        var throughOwn = await other.Client.PutAsJsonAsync(
            $"{other.Organisation}/tournaments/{tournament.Id}/entries/{team.EntryId}/roster/members/{ana}", new { expectedRevision = 0 }, Cancellation);
        var foreignGuest = await AddAsync(team, await GuestAsync(other, "Sam Reed"));

        throughOwn.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        foreignGuest.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        Members(await RosterAsync(team)).ShouldBeEmpty();
    }
}
