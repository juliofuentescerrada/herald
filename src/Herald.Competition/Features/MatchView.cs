using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Herald.Competition.Features;

public sealed record PlayerDetails(Guid PlayerId, string Name);

public sealed record LineupDetails(int Number, IReadOnlyList<PlayerDetails> Players, DateTimeOffset RecordedAt);

// A side of a match: its entrant and, for a team match, its frozen roster (null while unknown) and lineups.
public sealed record SideDetails(EntrantDetails Entrant, IReadOnlyList<PlayerDetails>? Roster, IReadOnlyList<LineupDetails> Lineups);

// A match's effective result; appearances are named on the match view only (h1-operator-results D-2). The reason is a no contest's,
// private to the organisation: admin API only.
public sealed record ResultDetails(Outcome Outcome, Cause Cause, bool Played, string? Reason, DateTimeOffset RecordedAt);

public sealed record MatchStartDetails(DateTimeOffset StartedAt, int? FirstLineup, int? SecondLineup);

// What every match write and the match read answer with. Blockers say why the match cannot start now.
public sealed record MatchView(
    Guid MatchId,
    int Revision,
    int Round,
    MatchState State,
    int? ActivePlayers,
    SideDetails First,
    SideDetails Second,
    MatchStartDetails? Start,
    IReadOnlyList<string> Blockers,
    ResultDetails? Result,
    IReadOnlyList<PlayerDetails> Appearances)
{
    public static MatchView Of(Match match, Schedule schedule)
    {
        var names = schedule.StartedPairings?.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name) ?? [];
        var players = schedule.Rosters?.Teams.SelectMany(team => team.Players).DistinctBy(player => player.PlayerId)
            .ToDictionary(player => player.PlayerId, player => player.Name) ?? [];
        PlayerDetails Player(Guid id) => new(id, players.GetValueOrDefault(id, ""));
        SideDetails SideOf(Side side, IReadOnlyList<Lineup> lineups)
        {
            var entry = match.EntryOf(side);
            var roster = match.IsTeamMatch ? schedule.Rosters?.Teams.SingleOrDefault(team => team.EntryId == entry) : null;
            return new(
                new(entry, names.GetValueOrDefault(entry, "")),
                roster is null ? null : [.. roster.Players.OrderBy(player => player.Name, StringComparer.InvariantCulture).Select(player => new PlayerDetails(player.PlayerId, player.Name))],
                [.. lineups.Select(lineup => new LineupDetails(lineup.Number, [.. lineup.Players.Select(Player)], lineup.RecordedAt))]);
        }

        return new(
            match.Id.Value,
            match.Revision,
            match.Round,
            match.State,
            match.ActivePlayers,
            SideOf(Side.First, match.FirstLineups),
            SideOf(Side.Second, match.SecondLineups),
            match.Start is { } start ? new(start.StartedAt, start.FirstLineup, start.SecondLineup) : null,
            match.State == MatchState.Scheduled
                ? [.. match.StartBlockers(schedule.RosterOf(match.First), schedule.RosterOf(match.Second)).Select(rule => $"{rule.Field}-{rule.Rule}")]
                : [],
            ResultOf(match),
            [.. (match.Resolution?.Appearances ?? []).Select(Player)]);
    }

    public static ResultDetails? ResultOf(Match match) =>
        match.Resolution is { } resolution ? new(resolution.Outcome, resolution.Cause, resolution.Played, resolution.Reason, resolution.RecordedAt) : null;
}

internal static class MatchResults
{
    public const string RevisionConflict = "match-revision-conflict";

    private const int Attempts = 3;

    // Loads the match and its schedule, applies the write and saves it; the same 404 for another organisation's match.
    public static async Task<IResult> WriteAsync(
        this CompetitionDbContext db, Guid tournamentId, Guid matchId, Func<Match, Schedule, WriteResult> write, CancellationToken cancellationToken)
    {
        var tournament = new TournamentId(tournamentId);
        var id = new MatchId(matchId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Matches.SingleOrDefaultAsync(match => match.Id == id && match.TournamentId == tournament, cancellationToken) is not { } match
                || await db.Schedules.AsNoTracking().SingleOrDefaultAsync(schedule => schedule.Id == tournament, cancellationToken) is not { } schedule)
            {
                return ScheduleResults.NotFound();
            }

            var result = write(match, schedule);
            switch (result.Outcome)
            {
                case WriteOutcome.Rejected:
                    return Results.ValidationProblem(
                        result.Broken.GroupBy(rule => rule.Field).ToDictionary(field => field.Key, field => field.Select(rule => rule.Rule).ToArray()),
                        extensions: new Dictionary<string, object?> { ["match"] = MatchView.Of(match, schedule) });
                case WriteOutcome.Stale:
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        type: RevisionConflict,
                        extensions: new Dictionary<string, object?> { ["currentRevision"] = match.Revision, ["match"] = MatchView.Of(match, schedule) });
                case WriteOutcome.Applied:
                    try
                    {
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateConcurrencyException) when (attempt < Attempts)
                    {
                        db.ChangeTracker.Clear();
                        continue;
                    }

                    break;
            }

            return Results.Ok(MatchView.Of(match, schedule));
        }
    }
}
