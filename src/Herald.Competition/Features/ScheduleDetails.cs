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
public sealed record MatchSummary(Guid MatchId, int Round, EntrantDetails First, EntrantDetails Second, MatchState State);

public sealed record RoundDetails(int Number, IReadOnlyList<MatchDetails> Matches, EntrantDetails? Rest);

public sealed record PairingsDetails(Seeding Seeding, int? Seed, int Entrants, int Matches, IReadOnlyList<RoundDetails> Rounds);

public sealed record DraftDetails(PairingsDetails Pairings, DateTimeOffset GeneratedAt, bool Stale);

public sealed record FieldChangeDetails(IReadOnlyList<EntrantDetails> Added, IReadOnlyList<EntrantDetails> Removed);

// The withdrawal reason is the organisation's own, shown only to its owner (A-4).
public sealed record PublicationDetails(int Number, PairingsDetails Pairings, DateTimeOffset PublishedAt, string? WithdrawalReason, DateTimeOffset? WithdrawnAt);

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
    IReadOnlyList<MatchSummary> Matches)
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
        MatchesOf(schedule, matches));

    private static List<MatchSummary> MatchesOf(Schedule schedule, IReadOnlyList<Match> matches)
    {
        var names = schedule.StartedPairings?.Entrants.ToDictionary(entrant => entrant.EntryId, entrant => entrant.Name) ?? [];
        EntrantDetails Entrant(Guid id) => new(id, names.GetValueOrDefault(id, ""));
        // In the schedule's own order, as the pairings list them.
        var order = schedule.StartedPairings?.Matches.Select((pairing, index) => (pairing, index)).ToDictionary(item => (item.pairing.First, item.pairing.Second), item => item.index) ?? [];
        return [.. matches.OrderBy(match => match.Round).ThenBy(match => order.GetValueOrDefault((match.First, match.Second))).Select(match => new MatchSummary(match.Id.Value, match.Round, Entrant(match.First), Entrant(match.Second), match.State))];
    }

    public static async Task<ScheduleDetails> OfAsync(CompetitionDbContext db, Schedule schedule, CancellationToken cancellationToken) =>
        Of(schedule, await db.Matches.AsNoTracking().Where(match => match.TournamentId == schedule.Id).ToListAsync(cancellationToken));

    // The snapshot Tournaments keeps to lock the field and, later, to check start (D-4).
    public static TournamentScheduleChanged Changed(Guid organisationId, Schedule schedule) =>
        new(organisationId, schedule.Id.Value, schedule.Revision, schedule.Current?.Number, schedule.Current?.Pairings.EligibleRevision);

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
    public static async Task<IResult> WriteAsync(
        this CompetitionDbContext db, IMessageBus bus, Guid organisationId, Guid tournamentId, Func<Schedule, WriteResult> write, CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Schedules.SingleOrDefaultAsync(schedule => schedule.Id == id, cancellationToken) is not { } schedule)
            {
                return NotFound();
            }

            var result = write(schedule);
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
                    break;
            }

            return Results.Ok(await ScheduleDetails.OfAsync(db, schedule, cancellationToken));
        }
    }
}
