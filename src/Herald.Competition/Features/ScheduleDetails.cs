using Herald.Competition.Domain;
using Herald.Competition.Persistence;
using Herald.Contracts.Competition.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace Herald.Competition.Features;

public sealed record EntrantDetails(Guid EntryId, string Name);

public sealed record MatchDetails(EntrantDetails First, EntrantDetails Second);

// A match of the running competition, for the Schedule page (h1-match-lineups D-5).
public sealed record MatchSummary(Guid MatchId, int Round, EntrantDetails First, EntrantDetails Second, MatchState State, ResultDetails? Result);

public sealed record RoundStateDetails(int Number, RoundState State);

// A scheduled team match whose current lineup includes an unavailable player, naming the side's entrant and the player.
public sealed record AttentionDetails(Guid MatchId, int Round, EntrantDetails Entrant, PlayerDetails Player);

// Where a running competition stands, for the top of the Schedule page (h1-round-operations D-5).
public sealed record OperationsDetails(int Scheduled, int InPlay, int Resolved, IReadOnlyList<RoundStateDetails> Rounds, IReadOnlyList<AttentionDetails> Attention);

public enum PlayerStatus
{
    Available,
    Withdrawn,
    Sanctioned,
}

// A frozen-roster player with their availability; the reason is the latest withdrawal's or active sanction's, private to the organisation.
public sealed record RosterPlayerDetails(Guid PlayerId, string Name, PlayerStatus Status, string? Reason);

// An entrant of the running competition, for the Entrants panel; the departure reason is the organisation's own. A team's frozen
// roster is null while unknown, and for an individual entrant.
public sealed record CompetitorDetails(
    Guid EntryId, string Name, EntrantStatus Status, string? Reason, DateTimeOffset? DepartedAt, IReadOnlyList<RosterPlayerDetails>? Roster);

public sealed record RoundDetails(int Number, IReadOnlyList<MatchDetails> Matches, EntrantDetails? Rest);

public sealed record PairingsDetails(Seeding Seeding, int? Seed, int Entrants, int Matches, IReadOnlyList<RoundDetails> Rounds);

public sealed record DraftDetails(PairingsDetails Pairings, DateTimeOffset GeneratedAt, bool Stale);

public sealed record FieldChangeDetails(IReadOnlyList<EntrantDetails> Added, IReadOnlyList<EntrantDetails> Removed);

// The withdrawal reason is the organisation's own, shown only to its owner (A-4).
public sealed record PublicationDetails(int Number, PairingsDetails Pairings, DateTimeOffset PublishedAt, string? WithdrawalReason, DateTimeOffset? WithdrawnAt);

// A final revision, newest first in the schedule; the reopening reason is the organisation's own (h1-finalisation D-3, A-2).
public sealed record FinalRevisionDetails(
    int Number, int ResultsRevision, DateTimeOffset FinalisedAt, string? FinalisedBy, string? ReopenReason, DateTimeOffset? ReopenedAt, string? ReopenedBy);

// What every schedule write and the schedule read answer with. Blockers say why a draft cannot be generated now.
// Once the competition started, the revision it started on, and whether a withdrawal crossed it (h1-competition-start D-4).
public sealed record ScheduleDetails(
    Guid TournamentId,
    int Revision,
    bool RegistrationClosed,
    IReadOnlyList<EntrantDetails> Pending,
    int Eligible,
    IReadOnlyList<string> Blockers,
    DraftDetails? Draft,
    FieldChangeDetails? DraftChange,
    PublicationDetails? Current,
    FieldChangeDetails? CrossedChange,
    IReadOnlyList<PublicationDetails> History,
    int? StartedOnRevision,
    DateTimeOffset? StartedAt,
    bool StartCrossedWithdrawal,
    IReadOnlyList<MatchSummary> Matches,
    OperationsDetails? Operations,
    IReadOnlyList<CompetitorDetails> Entrants,
    int ResultsRevision,
    bool Finalised,
    IReadOnlyList<FinalRevisionDetails> Finals,
    bool Cancelled)
{
    public static ScheduleDetails Of(Schedule schedule, IReadOnlyList<Match> matches) => new(
        schedule.Id.Value,
        schedule.Revision,
        schedule.Field.RegistrationClosed,
        [.. schedule.Field.Pending.Select(pending => new EntrantDetails(pending.EntryId, pending.Name))],
        schedule.Field.Entrants.Count,
        [.. schedule.Blockers.Select(rule => $"{rule.Field}-{rule.Rule}")],
        schedule.Draft is { } draft ? new(PairingsOf(draft.Pairings), draft.GeneratedAt, schedule.IsDraftStale) : null,
        ChangeOf(schedule.DraftChange),
        schedule.Current is { } current ? PublicationOf(current) : null,
        ChangeOf(schedule.CrossedChange),
        [.. schedule.Publications.Reverse().Select(PublicationOf)],
        schedule.StartedOnRevision,
        schedule.StartedAt,
        schedule.StartCrossedWithdrawal,
        MatchesOf(schedule, matches),
        OperationsOf(schedule, matches),
        CompetitorsOf(schedule),
        schedule.ResultsRevision,
        schedule.IsFinalised,
        [.. schedule.Finals.Reverse().Select(final => new FinalRevisionDetails(
            final.Number, final.ResultsRevision, final.FinalisedAt, final.FinalisedByName, final.ReopenReason, final.ReopenedAt, final.ReopenedByName))],
        schedule.IsCancelled);

    // Null until the competition's matches exist.
    private static OperationsDetails? OperationsOf(Schedule schedule, IReadOnlyList<Match> matches)
    {
        if (matches.Count == 0)
        {
            return null;
        }

        var unavailable = schedule.UnavailablePlayers;
        var names = schedule.StartedPairings?.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name) ?? [];
        var players = schedule.Rosters?.Teams.SelectMany(team => team.Players).DistinctBy(player => player.PlayerId).ToDictionary(player => player.PlayerId, player => player.Name) ?? [];
        var attention = matches
            .Where(match => match.State == MatchState.Scheduled)
            .OrderBy(match => match.Round)
            .SelectMany(match => new[] { Side.First, Side.Second }.SelectMany(side =>
                (match.CurrentLineup(side)?.Players ?? []).Where(unavailable.Contains).Select(player => new AttentionDetails(
                    match.Id.Value, match.Round, new(match.EntryOf(side), names.GetValueOrDefault(match.EntryOf(side), "")), new(player, players.GetValueOrDefault(player, ""))))));
        return new(
            matches.Count(match => match.State == MatchState.Scheduled),
            matches.Count(match => match.State == MatchState.InPlay),
            matches.Count(match => match.State == MatchState.Resolved),
            [.. Rounds.Of(matches).Select(round => new RoundStateDetails(round.Round, round.State))],
            [.. attention]);
    }

    // Empty before start; then the started field in admission order.
    private static List<CompetitorDetails> CompetitorsOf(Schedule schedule) =>
        [.. (schedule.StartedPairings?.Entrants ?? []).OrderBy(entrant => entrant.AdmissionOrder).Select(entrant =>
        {
            var departure = schedule.DepartureOf(entrant.EntryId);
            var roster = schedule.Rosters?.Teams.SingleOrDefault(team => team.EntryId == entrant.EntryId);
            return new CompetitorDetails(
                entrant.EntryId,
                entrant.Name,
                schedule.StatusOf(entrant.EntryId),
                departure?.Reason,
                departure?.DepartedAt,
                roster is null ? null : [.. roster.Players.OrderBy(player => player.Name, StringComparer.InvariantCulture).Select(player => PlayerOf(schedule, entrant.EntryId, player))]);
        })];

    private static RosterPlayerDetails PlayerOf(Schedule schedule, Guid entryId, RosterPlayer player)
    {
        var availability = schedule.Players.SingleOrDefault(other => other.EntryId == entryId && other.PlayerId == player.PlayerId);
        return availability switch
        {
            { Withdrawal: { } withdrawal } => new(player.PlayerId, player.Name, PlayerStatus.Withdrawn, withdrawal.Reason),
            { Sanctions: [.., { IsActive: true } sanction] } => new(player.PlayerId, player.Name, PlayerStatus.Sanctioned, sanction.Reason),
            _ => new(player.PlayerId, player.Name, PlayerStatus.Available, null),
        };
    }

    private static List<MatchSummary> MatchesOf(Schedule schedule, IReadOnlyList<Match> matches)
    {
        var names = schedule.StartedPairings?.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name) ?? [];
        EntrantDetails Entrant(Guid id) => new(id, names.GetValueOrDefault(id, ""));
        // In the schedule's own order, as the pairings list them.
        var order = schedule.StartedPairings?.Matches.Select((pairing, index) => (pairing, index)).ToDictionary(item => (item.pairing.First, item.pairing.Second), item => item.index) ?? [];
        return [.. matches.OrderBy(match => match.Round).ThenBy(match => order.GetValueOrDefault((match.First, match.Second))).Select(match => new MatchSummary(match.Id.Value, match.Round, Entrant(match.First), Entrant(match.Second), match.State, MatchView.ResultOf(match)))];
    }

    public static async Task<ScheduleDetails> OfAsync(CompetitionDbContext db, Schedule schedule, CancellationToken cancellationToken) =>
        Of(schedule, await db.Matches.AsNoTracking().Where(match => match.TournamentId == schedule.Id).ToListAsync(cancellationToken));

    // The snapshot Tournaments keeps to lock the field and, later, to check start (D-4).
    // With the published pairings and aliases, for the public page (h1-public-read D-1).
    public static TournamentScheduleChanged Changed(Guid organisationId, Schedule schedule) =>
        new(organisationId, schedule.Id.Value, schedule.Revision, schedule.Current?.Number, schedule.Current?.Pairings.EligibleRevision,
            schedule.Current?.Pairings is { } pairings
                ? new PublishedSchedule(
                    [.. pairings.Entrants.Select(entrant => new ScheduleEntrant(entrant.EntryId, entrant.Name))],
                    [.. pairings.Matches.Select(match => new SchedulePairing(match.Round, match.First, match.Second))],
                    [.. pairings.Rests.Select(rest => new ScheduleRest(rest.Round, rest.EntryId))])
                : null);

    private static PublicationDetails PublicationOf(Publication publication) =>
        new(publication.Number, PairingsOf(publication.Pairings), publication.PublishedAt, publication.WithdrawalReason, publication.WithdrawnAt);

    private static FieldChangeDetails? ChangeOf(FieldChange? change) => change is null ? null : new(
        [.. change.Added.Select(entrant => new EntrantDetails(entrant.EntryId, entrant.Name))],
        [.. change.Removed.Select(entrant => new EntrantDetails(entrant.EntryId, entrant.Name))]);

    private static PairingsDetails PairingsOf(Pairings pairings)
    {
        var names = pairings.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => new EntrantDetails(entrant.EntryId, entrant.Name));
        var rounds = pairings.Matches.Select(match => match.Round).Concat(pairings.Rests.Select(rest => rest.Round)).Distinct().Order();
        return new(
            pairings.Seeding,
            pairings.Seed,
            pairings.Entrants.Count,
            pairings.Matches.Count,
            [.. rounds.Select(round => new RoundDetails(
                round,
                [.. pairings.Matches.Where(match => match.Round == round).Select(match => new MatchDetails(names[match.First], names[match.Second]))],
                pairings.Rests.FirstOrDefault(rest => rest.Round == round) is { } rest ? names[rest.EntryId] : null))]);
    }
}

internal static class ScheduleResults
{
    public const string RevisionConflict = "schedule-revision-conflict";

    private const int Attempts = 3;

    // The same answer for a tournament without a schedule and for another organisation's.
    public static IResult NotFound() => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");

    // Loads the schedule, applies the write and saves it with its snapshot event in the same transaction.
    public static Task<IResult> WriteAsync(
        this CompetitionDbContext db, IMessageBus bus, Guid organisationId, Guid tournamentId, Func<Schedule, WriteResult> write, CancellationToken cancellationToken) =>
        db.WriteAsync(bus, organisationId, tournamentId, (schedule, _) => write(schedule), cancellationToken);

    // The same with the tournament's matches, tracked, for a write that resolves them too (h1-round-operations D-2). A change of the
    // results revision publishes the results with it.
    public static async Task<IResult> WriteAsync(
        this CompetitionDbContext db, IMessageBus bus, Guid organisationId, Guid tournamentId, Func<Schedule, IReadOnlyList<Match>, WriteResult> write, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is not { } schedule)
            {
                return NotFound();
            }

            var tracked = await db.Matches.Where(match => match.TournamentId == id).ToListAsync(cancellationToken);
            var resultsRevision = schedule.ResultsRevision;
            var result = schedule.IsCancelled ? Schedule.CancelledRefusal : write(schedule, tracked);
            switch (result.Outcome)
            {
                // Both carry the current schedule, so a rejection names its blockers (pending entries included) and a
                // conflict shows what the other write left (D-8).
                case WriteOutcome.Rejected:
                    return Results.ValidationProblem(
                        result.Broken.GroupBy(rule => rule.Field).ToDictionary(field => field.Key, field => field.Select(rule => rule.Rule).ToArray()),
                        extensions: new Dictionary<string, object?> { ["schedule"] = await ScheduleDetails.OfAsync(db, schedule, cancellationToken) });
                case WriteOutcome.Stale:
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        type: RevisionConflict,
                        extensions: new Dictionary<string, object?> { ["currentRevision"] = schedule.Revision, ["schedule"] = await ScheduleDetails.OfAsync(db, schedule, cancellationToken) });
                case WriteOutcome.Applied:
                    // A revision published after a crossed withdrawal is the one the matches come from.
                    await db.ScheduleMatchesAsync(schedule, cancellationToken);
                    try
                    {
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateConcurrencyException) when (attempt < Attempts)
                    {
                        db.ChangeTracker.Clear();
                        continue;
                    }

                    // Stored with the change by the transaction around the endpoint, sent after its commit.
                    await bus.PublishAsync(ScheduleDetails.Changed(organisationId, schedule));
                    await PublishFactsAsync(bus, organisationId, schedule, db.ActorName);
                    if (schedule.ResultsRevision != resultsRevision)
                    {
                        var matches = await db.Matches.Where(match => match.TournamentId == id).ToListAsync(cancellationToken);
                        await bus.PublishAsync(ResultsSnapshot.Of(organisationId, schedule, matches));
                    }
                    break;
            }

            return Results.Ok(await ScheduleDetails.OfAsync(db, schedule, cancellationToken));
        }
    }

    // The notifiable facts of this write, as integration events (ADR 0017; h1-finalisation D-4).
    private static async Task PublishFactsAsync(IMessageBus bus, Guid organisationId, Schedule schedule, string? actorName)
    {
        foreach (var fact in schedule.DomainEvents)
        {
            switch (fact)
            {
                case Domain.CompetitionFinalised finalised:
                    await bus.PublishAsync(new Contracts.Competition.V1.CompetitionFinalised(
                        organisationId, schedule.Id.Value, finalised.ResultsRevision, finalised.Number, finalised.FinalisedBy, finalised.FinalisedAt));
                    break;
                case Domain.CompetitionReopened reopened:
                    await bus.PublishAsync(new Contracts.Competition.V1.CompetitionReopened(
                        organisationId, schedule.Id.Value, reopened.ResultsRevision, reopened.Number, reopened.ReopenedBy, reopened.ReopenedAt));
                    break;
                case Domain.SchedulePublished published:
                    await bus.PublishAsync(new Contracts.Competition.V1.SchedulePublished(
                        organisationId, schedule.Id.Value, published.Number, published.PublishedBy, actorName, published.PublishedAt));
                    break;
                // The reason stays in the publication history (Q1).
                case Domain.ScheduleWithdrawn withdrawn:
                    await bus.PublishAsync(new Contracts.Competition.V1.ScheduleWithdrawn(
                        organisationId, schedule.Id.Value, withdrawn.Number, "operator", withdrawn.WithdrawnBy, actorName, withdrawn.WithdrawnAt));
                    break;
            }
        }
    }
}
