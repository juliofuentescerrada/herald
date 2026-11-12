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
    ];

    private static async Task TournamentsByStateAsync(Admin admin, Guid organisation, Clock clock)
    {
        // Draft: configured but never published.
        await admin.CreateTournamentAsync(organisation, Ids.For("tournament", "draft"), Configuration(clock, "Winter Draft Cup", opens: 20, closes: 30, starts: 31));

        // Published, registration not open yet.
        var announced = Ids.For("tournament", "announced");
        await admin.CreateTournamentAsync(organisation, announced, Configuration(clock, "Spring Open", opens: 7, closes: 14, starts: 15));
        await admin.PublishAsync(organisation, announced);

        // Open with a full field and a waiting queue; one cancellation promoted the first waiting entry.
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

    private static object Configuration(Clock clock, string title, int opens, int closes, int starts, int capacity = 16, bool team = false) => new
    {
        title,
        gameVariant = team ? "Team strategy · Standard" : "Strategy game · Standard",
        entryKind = team ? "team" : "individual",
        capacity,
        minimumRosterSize = team ? 3 : (int?)null,
        maximumRosterSize = team ? 5 : (int?)null,
        activePlayersPerSide = team ? 3 : (int?)null,
        registrationOpensAt = clock.At(opens, 9),
        registrationClosesAt = clock.At(closes, 18),
        plannedStartAt = clock.At(starts, 10),
        timeZone = clock.TimeZone,
        location = "onSite",
        venue = "Lantern Hall",
        admission = "automatic",
        checkIn = "optional",
        visibility = "public",
    };
}
