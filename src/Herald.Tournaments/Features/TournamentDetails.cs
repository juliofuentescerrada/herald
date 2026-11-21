using Herald.Contracts.Tournaments.V1;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Wolverine;
using Contract = Herald.Contracts.Tournaments.V1;

namespace Herald.Tournaments.Features;

// The start conditions with what the owner needs to fix them (CP-04), and once running what start fixed.
// Unknown counts are null. The person who started is stored but not returned (design W-1).
public sealed record CompetitionDetails(
    IReadOnlyList<StartCondition> Conditions,
    int? Eligible,
    int? Pending,
    IReadOnlyList<RosterOutsideBounds>? RostersOutsideBounds,
    IReadOnlyList<SharedMemberName> SharedMemberNames,
    int? PublishedScheduleRevision,
    DateTimeOffset? StartedAt,
    int? StartedOnScheduleRevision);

// When and by whom the tournament was cancelled, with its private reason (D-6, A-1).
public sealed record CancellationDetails(DateTimeOffset CancelledAt, string? CancelledByName, string Reason, bool AfterStart);

// What every tournament write and the single read answer with: the response shape is one contract, not a feature.
public sealed record TournamentDetails(
    Guid Id,
    int Revision,
    Publication Publication,
    RegistrationWindow Registration,
    string Competition,
    string Profile,
    TournamentConfiguration Configuration,
    IReadOnlyList<string> MissingForPublication,
    IReadOnlyList<string> MissingForRegistration,
    DateTimeOffset? RegistrationChangedAt,
    int AdmittedEntries,
    int WaitingEntries,
    int CheckedInEntries,
    bool SchedulePublished,
    CompetitionDetails Start,
    bool Archived,
    CancellationDetails? Cancellation)
{
    public const string CompetitionPreparation = "preparation";

    public const string CompetitionRunning = "running";

    public const string CompetitionFinalised = "finalised";

    public const string CompetitionCancelled = "cancelled";

    // The only H1 profile (D-04): single round-robin, 3 / 1 / 0.
    public const string RoundRobinProfile = "singleRoundRobin-3-1-0";

    public static string CompetitionOf(CompetitionState state) => state switch
    {
        CompetitionState.Running => CompetitionRunning,
        CompetitionState.Finalised => CompetitionFinalised,
        CompetitionState.Cancelled => CompetitionCancelled,
        _ => CompetitionPreparation,
    };

    public static TournamentDetails Of(Tournament tournament, EntryCounts entries, StartReadiness readiness) => new(
        tournament.Id.Value,
        tournament.Revision,
        tournament.Publication,
        tournament.Registration,
        CompetitionOf(tournament.Competition),
        RoundRobinProfile,
        tournament.Configuration,
        tournament.Configuration.MissingForPublication(),
        tournament.Configuration.MissingForRegistration(),
        // The person is stored but not returned: Tournaments cannot name them (design W-1).
        tournament.RegistrationChangedAt,
        entries.Admitted,
        entries.Waiting,
        entries.CheckedIn,
        readiness.PublishedScheduleRevision is not null,
        new(
            tournament.StartConditions(readiness),
            readiness.Eligible,
            readiness.Pending,
            readiness.RostersOutsideBounds,
            readiness.SharedMemberNames ?? [],
            readiness.PublishedScheduleRevision,
            tournament.StartedAt,
            tournament.StartedOnScheduleRevision),
        tournament.Archived,
        tournament.CancelledAt is { } cancelledAt
            ? new(cancelledAt, tournament.CancelledByName, tournament.CancellationReason!, tournament.IsStarted)
            : null);
}

internal static class TournamentResults
{
    public const string RevisionConflict = "tournament-revision-conflict";

    // The same answer for a tournament that does not exist and for another organisation's.
    public static IResult NotFound() => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");

    public static IResult Rejected(IReadOnlyList<BrokenRule> broken) => Results.ValidationProblem(
        broken.GroupBy(rule => rule.Field).ToDictionary(field => field.Key, field => field.Select(rule => rule.Rule).ToArray()));

    // The current tournament comes with it, so the owner reads what changed (competition-start).
    public static IResult Stale(int currentRevision, TournamentDetails? current = null) => Results.Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "Conflict",
        type: RevisionConflict,
        extensions: new Dictionary<string, object?> { ["currentRevision"] = currentRevision, ["tournament"] = current });

    // Saves now, so a write that lost a race answers 409 instead of failing after the handler.
    // A published tournament's change also tells Registration its entry terms, in the same transaction.
    public static async Task<IResult> SavedAsync(
        this TournamentsDbContext db, IMessageBus bus, Guid organisationId, Tournament tournament, WriteResult result, CancellationToken cancellationToken)
    {
        switch (result.Outcome)
        {
            case WriteOutcome.Rejected:
                return Rejected(result.Broken);
            case WriteOutcome.Stale:
                return Stale(tournament.Revision, await db.DetailsAsync(tournament, cancellationToken));
            case WriteOutcome.Applied:
                var locked = await db.SchedulePublishedAsync(tournament.Id, cancellationToken);
                var started = tournament.DomainEvents.OfType<CompetitionStarted>().SingleOrDefault();
                var cancelled = tournament.DomainEvents.OfType<Domain.TournamentCancelled>().SingleOrDefault();
                var archive = tournament.DomainEvents.OfType<Domain.TournamentArchiveChanged>().SingleOrDefault();
                if (tournament.Publication == Publication.Published)
                {
                    tournament.NextTermsRevision();
                }

                // The change log entries commit with the change that made them (change-log D-2).
                db.ChangeLog.AddRange(tournament.Logged);
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                // The winner of the race may have logged the same revision first: its change log key says so too.
                catch (Exception exception) when (exception is DbUpdateConcurrencyException
                    || exception is DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "PK_ChangeLog" } })
                {
                    db.ChangeTracker.Clear();
                    tournament = await db.Tournaments.SingleAsync(t => t.Id == tournament.Id, cancellationToken);
                    return Stale(tournament.Revision, await db.DetailsAsync(tournament, cancellationToken));
                }

                if (tournament.Publication == Publication.Published)
                {
                    await bus.PublishAsync(EntryTerms(organisationId, tournament, locked));
                }

                if (started is not null)
                {
                    await bus.PublishAsync(new TournamentCompetitionStarted(
                        organisationId, tournament.Id.Value, tournament.Revision, started.EligibleRevision, started.ScheduleRevision, started.StartedBy, started.StartedAt,
                        tournament.Configuration.ActivePlayersPerSide));
                }

                if (cancelled is not null)
                {
                    await bus.PublishAsync(new Contract.TournamentCancelled(
                        organisationId, tournament.Id.Value, tournament.Revision, cancelled.AfterStart, cancelled.CancelledBy, cancelled.CancelledAt));
                }

                if (archive is not null)
                {
                    await bus.PublishAsync(new Contract.TournamentArchiveChanged(
                        organisationId, tournament.Id.Value, tournament.Revision, archive.Archived, archive.ChangedBy, archive.ChangedAt));
                }

                break;
        }

        return Results.Ok(await db.DetailsAsync(tournament, cancellationToken));
    }

    public static async Task<TournamentDetails> DetailsAsync(this TournamentsDbContext db, Tournament tournament, CancellationToken cancellationToken) =>
        TournamentDetails.Of(tournament, await db.EntryCountsAsync(tournament.Id, cancellationToken), await db.StartReadinessAsync(tournament.Id, cancellationToken));

    // A published tournament is complete, so its entry terms are all present (R-5).
    public static TournamentEntryTermsChanged EntryTerms(Guid organisationId, Tournament tournament, bool fieldLocked) => new(
        organisationId,
        tournament.Id.Value,
        tournament.TermsRevision,
        tournament.Registration switch
        {
            RegistrationWindow.Open => RegistrationState.Open,
            RegistrationWindow.Closed => RegistrationState.Closed,
            _ => RegistrationState.NotOpen,
        },
        tournament.Configuration.Capacity!.Value,
        tournament.Configuration.EntryKind == Domain.EntryKind.Team ? Contract.EntryKind.Team : Contract.EntryKind.Individual,
        tournament.Configuration.Admission == Domain.Admission.Manual ? Contract.Admission.Manual : Contract.Admission.Automatic,
        tournament.Configuration.EntryKind == Domain.EntryKind.Team ? tournament.Configuration.MinimumRosterSize : null,
        tournament.Configuration.EntryKind == Domain.EntryKind.Team ? tournament.Configuration.MaximumRosterSize : null,
        tournament.Configuration.CheckIn == Domain.CheckIn.Mandatory ? Contract.CheckInPolicy.Mandatory : Contract.CheckInPolicy.Optional,
        fieldLocked || tournament.IsStarted,
        tournament.IsStarted);

    public static bool IsDuplicateKey(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
