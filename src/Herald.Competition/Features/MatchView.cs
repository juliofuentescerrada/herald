using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace Herald.Competition.Features;

public sealed record PlayerDetails(Guid PlayerId, string Name);

public sealed record LineupDetails(int Number, IReadOnlyList<PlayerDetails> Players, DateTimeOffset RecordedAt);

// A side of a match: its entrant and, for a team match, its frozen roster (null while unknown) and lineups.
public sealed record SideDetails(EntrantDetails Entrant, IReadOnlyList<PlayerDetails>? Roster, IReadOnlyList<LineupDetails> Lineups);

// A match's effective result; appearances are named on the match view only (h1-operator-results D-2). The reason is a no contest's,
// private to the organisation: admin API only.
// RecordedBy names who recorded it as they were named then: a person, or an application with the owner who granted it
// (pilot-access); null for results recorded before names were kept, and for those a departure resolved.
public sealed record ResultDetails(Outcome Outcome, Cause Cause, bool Played, string? Reason, DateTimeOffset RecordedAt, string? RecordedBy = null);

// A result replaced by a correction, with when it was replaced and why (h1-safe-corrections D-5); admin API only.
public sealed record ReplacedResultDetails(ResultDetails Result, DateTimeOffset ReplacedAt, string CorrectionReason);

public sealed record MatchStartDetails(DateTimeOffset StartedAt, int? FirstLineup, int? SecondLineup);

// What every match write and the match read answer with. Blockers say why the match cannot start now; unavailable players are
// the withdrawn and sanctioned ones of either frozen roster (h1-round-operations D-3).
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
    IReadOnlyList<ReplacedResultDetails> ReplacedResults,
    IReadOnlyList<PlayerDetails> Appearances,
    IReadOnlyList<PlayerDetails> Unavailable)
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
                ? [.. match.StartBlockers(schedule.RosterOf(match.First), schedule.RosterOf(match.Second), schedule.UnavailablePlayers).Select(rule => $"{rule.Field}-{rule.Rule}")]
                : [],
            ResultOf(match),
            [.. match.ReplacedResolutions.Select(replaced => new ReplacedResultDetails(Of(replaced.Resolution), replaced.ReplacedAt, replaced.Reason))],
            [.. (match.Resolution?.Appearances ?? []).Select(Player)],
            match.IsTeamMatch
                ? [.. schedule.Players.Where(player => player.IsUnavailable && (player.EntryId == match.First || player.EntryId == match.Second)).Select(player => Player(player.PlayerId))]
                : []);
    }

    public static ResultDetails? ResultOf(Match match) => match.Resolution is { } resolution ? Of(resolution) : null;

    private static ResultDetails Of(Resolution resolution) =>
        new(resolution.Outcome, resolution.Cause, resolution.Played, resolution.Reason, resolution.RecordedAt, resolution.RecordedByName);
}

internal static class MatchResults
{
    public const string RevisionConflict = "match-revision-conflict";

    // Every resolution of a tournament also writes its schedule's results revision, so simultaneous results of different
    // matches queue on that row and each conflict is tried again.
    // shortcut: more than ten results saved at the same instant in one tournament fail the last ones; lock the schedule row if that ever happens.
    private const int Attempts = 10;

    // Loads the match and its schedule, applies the write and saves it; the same 404 for another organisation's match.
    // A resolution also publishes the next results revision with it (h1-standings D-1).
    public static async Task<IResult> WriteAsync(
        this CompetitionDbContext db, IMessageBus bus, Guid organisationId, Guid tournamentId, Guid matchId, Func<Match, Schedule, WriteResult> write, CancellationToken cancellationToken)
    {
        var tournament = new TournamentId(tournamentId);
        var id = new MatchId(matchId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Matches.SingleOrDefaultAsync(match => match.Id == id && match.TournamentId == tournament, cancellationToken) is not { } match
                || await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == tournament, cancellationToken) is not { } schedule)
            {
                return ScheduleResults.NotFound();
            }

            // A first resolution or a correction (h1-safe-corrections D-1) changes the results.
            var before = match.Resolution;
            var result = schedule.IsFinalised ? Schedule.FinalisedRefusal : write(match, schedule);
            var resolved = result.Outcome == WriteOutcome.Applied && !ReferenceEquals(before, match.Resolution);
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
                    if (resolved)
                    {
                        schedule.ResultRecorded();
                    }

                    // Checked against the schedule's revision, so a write racing a finalisation commits first or is retried and
                    // refused (h1-finalisation D-2).
                    db.Entry(schedule).Property(s => s.Revision).IsModified = true;

                    try
                    {
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateConcurrencyException) when (attempt < Attempts)
                    {
                        db.ChangeTracker.Clear();
                        continue;
                    }

                    if (resolved)
                    {
                        // Stored with the change by the transaction around the endpoint, sent after its commit.
                        var matches = await db.Matches.Where(other => other.TournamentId == tournament).ToListAsync(cancellationToken);
                        await bus.PublishAsync(ResultsSnapshot.Of(organisationId, schedule, matches));
                    }

                    break;
            }

            return Results.Ok(MatchView.Of(match, schedule));
        }
    }
}
