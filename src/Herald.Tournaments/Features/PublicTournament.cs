using Herald.Contracts.Competition.V1;
using Herald.Contracts.Standings.V1;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Herald.Tournaments.Features;

// The public page's model (h1-public-read D-1, D-2): no field for contacts, reasons, rosters, lineups, drafts or any identifier
// other than the tournament's. Entrants are their aliases.
public sealed record PublicMatch(string First, string Second, ResultsMatchState State, ResultOutcome? Outcome, string? Cause);

public sealed record PublicRound(int Number, IReadOnlyList<PublicMatch> Matches, string? Rest);

// A line of an entrant's explanation as Standings computed it: a resolved match or a rest (D-4). The page's own type: the contract's
// name is taken in the admin document.
public sealed record PublicLine(int Round, string? Opponent, StandingsLineResult? Result, string? Cause, int Points);

// A match the entrant has still to play, for its explanation (D-4).
public sealed record PublicRemainingMatch(int Round, string Opponent);

public sealed record PublicStandingsRow(
    int Position, bool Shared, string Name, StandingsEntrantStatus Status, int Resolved, int Won, int Drawn, int Lost, int Points,
    IReadOnlyList<PublicLine> Lines, IReadOnlyList<PublicRemainingMatch> Remaining);

// Final while the table is final, with its final revision; Revised once an earlier final revision was reopened.
public sealed record PublicStandings(
    bool Final, int? FinalRevision, bool Revised, int ResultsRevision, DateTimeOffset UpdatedAt, int ResolvedMatches, int Matches, bool NoChampion,
    IReadOnlyList<PublicStandingsRow> Rows);

public sealed record PublicChange(ChangeKind Kind, int SubjectRevision, DateTimeOffset At, IReadOnlyList<ChangedValue> Changes, string? TimeZone, string? Cause);

public sealed record PublicTournamentView(
    Guid Id,
    string Title,
    string Organiser,
    string? GameVariant,
    EntryKind? EntryKind,
    int? MinimumRosterSize,
    int? MaximumRosterSize,
    int? ActivePlayersPerSide,
    LocationMode? Location,
    string? Venue,
    DateTime? RegistrationOpensAt,
    DateTime? RegistrationClosesAt,
    DateTime? PlannedStartAt,
    string? TimeZone,
    Visibility? Visibility,
    RegistrationWindow Registration,
    string Competition,
    DateTimeOffset? CancelledAt,
    IReadOnlyList<PublicRound> Rounds,
    PublicStandings? Standings,
    IReadOnlyList<PublicChange> Changes);

public static class PublicTournament
{
    // What visitors may read: a published tournament that is public or unlisted (D-09, F-01a).
    public static bool IsReadable(Tournament tournament) =>
        tournament.Publication == Publication.Published && tournament.Configuration.Visibility is Visibility.Public or Visibility.Unlisted;

    // Composed from Tournaments' own records and projections in the organisation already entered (Q1).
    public static async Task<PublicTournamentView> ViewAsync(this TournamentsDbContext db, Tournament tournament, string organiser, CancellationToken cancellationToken)
    {
        var schedule = await db.Schedules.AsNoTracking().SingleOrDefaultAsync(state => state.TournamentId == tournament.Id, cancellationToken);
        var results = (await db.Results.AsNoTracking().SingleOrDefaultAsync(state => state.TournamentId == tournament.Id, cancellationToken))?.Results;
        var standings = (await db.Standings.AsNoTracking().SingleOrDefaultAsync(state => state.TournamentId == tournament.Id, cancellationToken))?.Standings;
        var changes = await db.PublicChangeLogAsync(tournament.Id, cancellationToken);
        var configuration = tournament.Configuration;
        return new(
            tournament.Id.Value,
            configuration.Title,
            organiser,
            configuration.GameVariant,
            configuration.EntryKind,
            configuration.MinimumRosterSize,
            configuration.MaximumRosterSize,
            configuration.ActivePlayersPerSide,
            configuration.Location,
            configuration.Venue,
            configuration.RegistrationOpensAt,
            configuration.RegistrationClosesAt,
            configuration.PlannedStartAt,
            configuration.TimeZone,
            configuration.Visibility,
            tournament.Registration,
            TournamentDetails.CompetitionOf(tournament.Competition),
            tournament.CancelledAt,
            RoundsOf(results, schedule?.Published),
            standings is null ? null : StandingsOf(standings, results, tournament.IsCancelled),
            [.. changes.Select(entry => new PublicChange(entry.Kind, entry.SubjectRevision, entry.At, entry.Changes, entry.TimeZone, entry.Cause))]);
    }

    // The entrants the page names, for the owner's preview before it becomes public (D-3).
    public static IReadOnlyList<string> AliasesOf(PublicTournamentView view) =>
        [.. view.Rounds.SelectMany(round => round.Matches.SelectMany(match => new[] { match.First, match.Second }).Append(round.Rest))
            .Concat(view.Standings?.Rows.Select(row => row.Name) ?? [])
            .OfType<string>().Distinct().Order(StringComparer.InvariantCulture)];

    // Once running, the results hold every match with its state; before start, the published pairings are all scheduled.
    private static List<PublicRound> RoundsOf(TournamentResultsChanged? results, PublishedSchedule? published)
    {
        if (results is not null)
        {
            var names = results.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name);
            return Rounds(
                results.Matches.Select(match => (match.Round, new PublicMatch(names[match.First], names[match.Second], match.State, match.Outcome, match.Cause))),
                results.Rests.Select(rest => (rest.Round, names[rest.EntryId])));
        }

        if (published is not null)
        {
            var names = published.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name);
            return Rounds(
                published.Matches.Select(match => (match.Round, new PublicMatch(names[match.First], names[match.Second], ResultsMatchState.Scheduled, null, null))),
                published.Rests.Select(rest => (rest.Round, names[rest.EntryId])));
        }

        return [];
    }

    private static List<PublicRound> Rounds(IEnumerable<(int Round, PublicMatch Match)> matches, IEnumerable<(int Round, string Name)> rests)
    {
        var list = matches.ToList();
        var resting = rests.ToList();
        return [.. list.Select(item => item.Round).Concat(resting.Select(rest => rest.Round)).Distinct().Order().Select(round => new PublicRound(
            round,
            [.. list.Where(item => item.Round == round).Select(item => item.Match)],
            resting.Where(rest => rest.Round == round).Select(rest => rest.Name).FirstOrDefault()))];
    }

    private static PublicStandings StandingsOf(TournamentStandingsChanged standings, TournamentResultsChanged? results, bool cancelled)
    {
        var names = results?.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name) ?? [];
        var unresolved = results?.Matches.Where(match => match.State != ResultsMatchState.Resolved).ToList() ?? [];
        return new(
            standings.Final is not null,
            standings.Final?.Number,
            standings.Final is not null && standings.Finals.Any(final => final.Reopened),
            standings.ResultsRevision,
            standings.ChangedAt,
            standings.ResolvedMatches,
            standings.Matches,
            // A tournament cancelled after start keeps its standings and has no champion (cancel-and-dates D-2).
            standings.NoChampion || cancelled,
            [.. standings.Rows.Select(row => new PublicStandingsRow(
                row.Position, row.Shared, row.Name, row.Status, row.Resolved, row.Won, row.Drawn, row.Lost, row.Points,
                [.. row.Lines.Select(line => new PublicLine(line.Round, line.Opponent, line.Result, line.Cause, line.Points))],
                [.. unresolved.Where(match => match.First == row.EntryId || match.Second == row.EntryId)
                    .Select(match => new PublicRemainingMatch(match.Round, names.GetValueOrDefault(match.First == row.EntryId ? match.Second : match.First, "")))]))]);
    }
}
