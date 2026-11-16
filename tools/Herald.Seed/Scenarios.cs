namespace Herald.Seed;

// One organisation of one persona and the steps that populate it. A scenario whose organisation the persona
// already owns is skipped (D-5), so a kept database is never seeded twice.
public sealed record Scenario(string Name, string PersonaKey, string OrganisationName, Func<Admin, Guid, Clock, Task> Steps)
{
    public Guid OrganisationId => Ids.For("organisation", Name);
}

// The H1 states delivered so far (ADR 0019); each later slice adds the scenarios of its states.
public static class Scenarios
{
    public static readonly IReadOnlyList<Scenario> All =
    [
        new("empty-organisation", Personas.Main, "Harbour Games Club", (_, _, _) => Task.CompletedTask),
        new("tournaments-by-state", Personas.Main, "Lantern Hall Players", TournamentsByStateAsync),
        new("second-organisation", Personas.Rival, "Riverside Board Society", SecondOrganisationAsync),
        new("pilot-applications", Personas.Main, "Beacon Street Gamers", PilotApplicationsAsync),
    ];

    private static async Task TournamentsByStateAsync(Admin admin, Guid organisation, Clock clock)
    {
        // Draft: configured but never published.
        await admin.CreateTournamentAsync(organisation, Ids.For("tournament", "draft"), Configuration(clock, "Winter Draft Cup", opens: 20, closes: 30, starts: 31));

        // Published, registration not open yet.
        var announced = Ids.For("tournament", "announced");
        await admin.CreateTournamentAsync(organisation, announced, Configuration(clock, "Spring Open", opens: 7, closes: 14, starts: 15));
        await admin.PublishAsync(organisation, announced);

        // Open with a full field and a waiting queue; one cancellation promoted the first waiting entry; the first entrant
        // has checked in, which locks the check-in policy.
        var open = Ids.For("tournament", "open");
        await admin.CreateTournamentAsync(organisation, open, Configuration(clock, "Autumn League", opens: -1, closes: 5, starts: 7, capacity: 4));
        await admin.PublishAsync(organisation, open);
        await admin.OpenRegistrationAsync(organisation, open);
        var entries = new List<Guid>();
        foreach (var name in Names.Players[..7])
        {
            entries.Add(await admin.EnterAsync(organisation, open, await admin.CreateGuestAsync(organisation, "player", name)));
        }

        await admin.CancelAsync(organisation, open, entries[1]);
        await admin.CheckInAsync(organisation, open, entries[0]);

        // Registration closed by hand before the start.
        var closed = Ids.For("tournament", "closed");
        await admin.CreateTournamentAsync(organisation, closed, Configuration(clock, "Midsummer Classic", opens: -10, closes: -1, starts: 2, capacity: 8));
        await admin.PublishAsync(organisation, closed);
        await admin.OpenRegistrationAsync(organisation, closed);
        foreach (var name in Names.Players[7..11])
        {
            await admin.EnterAsync(organisation, closed, await admin.CreateGuestAsync(organisation, "player", name));
        }

        await admin.CloseRegistrationAsync(organisation, closed);

        // Ready to pair: registration closed under mandatory check-in, four players checked in and one still pending,
        // so the absence review blocks the schedule (h1-round-robin-pairings).
        var league = Ids.For("tournament", "league");
        await admin.CreateTournamentAsync(organisation, league, Configuration(clock, "Lantern League", opens: -6, closes: -1, starts: 3, capacity: 6, checkIn: "mandatory"));
        await admin.PublishAsync(organisation, league);
        await admin.OpenRegistrationAsync(organisation, league);
        foreach (var name in Names.Players[11..16])
        {
            var entry = await admin.EnterAsync(organisation, league, await admin.CreateGuestAsync(organisation, "player", name));
            if (name != Names.Players[15])
            {
                await admin.CheckInAsync(organisation, league, entry);
            }
        }

        await admin.CloseRegistrationAsync(organisation, league);

        // Teams: one complete roster, one incomplete, one between the bounds and one with no players yet.
        var teams = Ids.For("tournament", "teams");
        await admin.CreateTournamentAsync(organisation, teams, Configuration(clock, "Harbour Team League", opens: -2, closes: 6, starts: 8, capacity: 4, team: true));
        await admin.PublishAsync(organisation, teams);
        await admin.OpenRegistrationAsync(organisation, teams);
        int[] rosterSizes = [3, 1, 4, 0];
        var player = 0;
        for (var team = 0; team < Names.Teams.Length; team++)
        {
            var entry = await admin.EnterAsync(organisation, teams, await admin.CreateGuestAsync(organisation, "team", Names.Teams[team]));
            for (var member = 0; member < rosterSizes[team]; member++)
            {
                await admin.AddRosterMemberAsync(organisation, teams, entry, await admin.CreateGuestAsync(organisation, "player", Names.Players[player++]));
            }
        }

        // Start blocked by one roster: registration closed and the schedule published, with one team below the
        // minimum (h1-competition-start). Its players are on other tournaments' rosters too, which is allowed.
        var cup = Ids.For("tournament", "cup");
        await admin.CreateTournamentAsync(organisation, cup, Configuration(clock, "Harbour Cup", opens: -5, closes: -1, starts: 2, capacity: 4, team: true));
        await admin.PublishAsync(organisation, cup);
        await admin.OpenRegistrationAsync(organisation, cup);
        int[] cupRosters = [3, 3, 2];
        player = 0;
        for (var team = 0; team < cupRosters.Length; team++)
        {
            var entry = await admin.EnterAsync(organisation, cup, await admin.CreateGuestAsync(organisation, "team", Names.Teams[team]));
            for (var member = 0; member < cupRosters[team]; member++)
            {
                await admin.AddRosterMemberAsync(organisation, cup, entry, await admin.CreateGuestAsync(organisation, "player", Names.Players[player++]));
            }
        }

        await admin.CloseRegistrationAsync(organisation, cup);
        await admin.PublishScheduleAsync(organisation, cup);

        // Running with five a side: two teams of seven frozen at start, their match scheduled without lineups
        // (h1-match-lineups).
        var running = Ids.For("tournament", "running-teams");
        await admin.CreateTournamentAsync(organisation, running, Configuration(clock, "Saltmarsh Team League", opens: -6, closes: -1, starts: 1, capacity: 4, team: true, rosters: (5, 7, 5)));
        await admin.PublishAsync(organisation, running);
        await admin.OpenRegistrationAsync(organisation, running);
        player = 0;
        foreach (var team in Names.Teams[2..])
        {
            var entry = await admin.EnterAsync(organisation, running, await admin.CreateGuestAsync(organisation, "team", team));
            for (var member = 0; member < 7; member++)
            {
                await admin.AddRosterMemberAsync(organisation, running, entry, await admin.CreateGuestAsync(organisation, "player", Names.Players[player++]));
            }
        }

        await admin.CloseRegistrationAsync(organisation, running);
        await admin.PublishScheduleAsync(organisation, running);
        await admin.StartCompetitionAsync(organisation, running);

        // Running individual league of four: its first match won by the first player and Dario Venn's win over Bram Holloway,
        // the other four to play (h1-operator-results); its standings share a position (h1-standings).
        var playing = Ids.For("tournament", "running-players");
        await admin.CreateTournamentAsync(organisation, playing, Configuration(clock, "Lantern Open", opens: -6, closes: -1, starts: 1, capacity: 4));
        await admin.PublishAsync(organisation, playing);
        await admin.OpenRegistrationAsync(organisation, playing);
        foreach (var name in Names.Players[..4])
        {
            await admin.EnterAsync(organisation, playing, await admin.CreateGuestAsync(organisation, "player", name));
        }

        await admin.CloseRegistrationAsync(organisation, playing);
        await admin.PublishScheduleAsync(organisation, playing);
        await admin.StartCompetitionAsync(organisation, playing);
        await admin.RecordResultAsync(organisation, playing, 0, outcome: "first");
        await admin.RecordWinAsync(organisation, playing, Names.Players[3], Names.Players[1]);

        // Running individual league of six with one match of each exceptional cause, the other eleven to play (h1-exceptional-outcomes).
        // A tournament of its own, so the results script keeps Lantern Open's matches; the exceptional outcomes script records here.
        var exceptional = Ids.For("tournament", "running-exceptional");
        await admin.CreateTournamentAsync(organisation, exceptional, Configuration(clock, "Lantern Shield", opens: -6, closes: -1, starts: 1, capacity: 6));
        await admin.PublishAsync(organisation, exceptional);
        await admin.OpenRegistrationAsync(organisation, exceptional);
        foreach (var name in Names.Players[4..10])
        {
            await admin.EnterAsync(organisation, exceptional, await admin.CreateGuestAsync(organisation, "player", name));
        }

        await admin.CloseRegistrationAsync(organisation, exceptional);
        await admin.PublishScheduleAsync(organisation, exceptional);
        await admin.StartCompetitionAsync(organisation, exceptional);
        await admin.RecordResultAsync(organisation, exceptional, 0, "concession", entrant: "first", played: false);
        await admin.RecordResultAsync(organisation, exceptional, 1, "singleAbsence", entrant: "second");
        await admin.RecordResultAsync(organisation, exceptional, 2, "doubleAbsence");
        await admin.RecordResultAsync(organisation, exceptional, 3, "noContest", played: false, reason: "Venue closed");

        // Running five-a-side cup of two teams of seven: both lineups recorded and a sanctioned starter blocking the start (h1-round-operations).
        var cupTeams = Ids.For("tournament", "running-operations-teams");
        await admin.CreateTournamentAsync(organisation, cupTeams, Configuration(clock, "Saltmarsh Team Cup", opens: -6, closes: -1, starts: 1, capacity: 4, team: true, rosters: (5, 7, 5)));
        await admin.PublishAsync(organisation, cupTeams);
        await admin.OpenRegistrationAsync(organisation, cupTeams);
        player = 0;
        foreach (var team in Names.Teams[..2])
        {
            var entry = await admin.EnterAsync(organisation, cupTeams, await admin.CreateGuestAsync(organisation, "team", team));
            for (var member = 0; member < 7; member++)
            {
                await admin.AddRosterMemberAsync(organisation, cupTeams, entry, await admin.CreateGuestAsync(organisation, "player", Names.Players[player++]));
            }
        }

        await admin.CloseRegistrationAsync(organisation, cupTeams);
        await admin.PublishScheduleAsync(organisation, cupTeams);
        await admin.StartCompetitionAsync(organisation, cupTeams);
        await admin.RecordLineupAsync(organisation, cupTeams, 0, "first", 5);
        await admin.RecordLineupAsync(organisation, cupTeams, 0, "second", 5);
        // Lineups take the first five by name: Ada Fenwick starts for Copper Owls.
        await admin.SanctionPlayerAsync(organisation, cupTeams, Names.Teams[0], Names.Players[0], "Abusive conduct");

        // Running individual league of four with Lior Ashby withdrawn after Kira Dunmore beat Nils Brandt, which completes round 1
        // (h1-round-operations).
        var trophy = Ids.For("tournament", "running-operations-players");
        await admin.CreateTournamentAsync(organisation, trophy, Configuration(clock, "Lantern Trophy", opens: -6, closes: -1, starts: 1, capacity: 4));
        await admin.PublishAsync(organisation, trophy);
        await admin.OpenRegistrationAsync(organisation, trophy);
        foreach (var name in Names.Players[10..14])
        {
            await admin.EnterAsync(organisation, trophy, await admin.CreateGuestAsync(organisation, "player", name));
        }

        await admin.CloseRegistrationAsync(organisation, trophy);
        await admin.PublishScheduleAsync(organisation, trophy);
        await admin.StartCompetitionAsync(organisation, trophy);
        await admin.RecordWinAsync(organisation, trophy, Names.Players[10], Names.Players[13]);
        await admin.WithdrawEntrantAsync(organisation, trophy, Names.Players[11], "Moved away");
    }

    private static async Task SecondOrganisationAsync(Admin admin, Guid organisation, Clock clock)
    {
        var open = Ids.For("tournament", "rival-open");
        await admin.CreateTournamentAsync(organisation, open, Configuration(clock, "Riverside Weekly", opens: -1, closes: 4, starts: 6, capacity: 8));
        await admin.PublishAsync(organisation, open);
        await admin.OpenRegistrationAsync(organisation, open);
        foreach (var name in Names.Players[12..15])
        {
            await admin.EnterAsync(organisation, open, await admin.CreateGuestAsync(organisation, "player", name));
        }
    }

    // An active grant for one tournament's results and a revoked one for all tournaments (h1-pilot-access).
    private static async Task PilotApplicationsAsync(Admin admin, Guid organisation, Clock clock)
    {
        var open = Ids.For("tournament", "pilot-open");
        await admin.CreateTournamentAsync(organisation, open, Configuration(clock, "Beacon Saturday Open", opens: -1, closes: 4, starts: 6, capacity: 8));
        await admin.PublishAsync(organisation, open);
        await admin.CreateTournamentAsync(organisation, Ids.For("tournament", "pilot-cup"), Configuration(clock, "Beacon Sunday Cup", opens: 3, closes: 9, starts: 10));
        var scoreboard = await admin.GrantAsync(organisation, "Old scoreboard", Ids.For("application", "old-scoreboard"), null, "read");
        await admin.RevokeAsync(organisation, scoreboard);
        await admin.GrantAsync(organisation, "Results bot", Ids.For("application", "results-bot"), [open], "read", "results");
    }

    private static object Configuration(Clock clock, string title, int opens, int closes, int starts, int capacity = 16, bool team = false, string checkIn = "optional", (int Minimum, int Maximum, int Active)? rosters = null) => new
    {
        title,
        gameVariant = team ? "Team strategy · Standard" : "Strategy game · Standard",
        entryKind = team ? "team" : "individual",
        capacity,
        minimumRosterSize = team ? rosters?.Minimum ?? 3 : (int?)null,
        maximumRosterSize = team ? rosters?.Maximum ?? 5 : (int?)null,
        activePlayersPerSide = team ? rosters?.Active ?? 3 : (int?)null,
        registrationOpensAt = clock.At(opens, 9),
        registrationClosesAt = clock.At(closes, 18),
        plannedStartAt = clock.At(starts, 10),
        timeZone = clock.TimeZone,
        location = "onSite",
        venue = "Lantern Hall",
        admission = "automatic",
        checkIn,
        visibility = "public",
    };
}
