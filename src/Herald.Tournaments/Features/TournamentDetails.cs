using Herald.Contracts.Tournaments.V1;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Wolverine;
using Contract = Herald.Contracts.Tournaments.V1;

namespace Herald.Tournaments.Features;

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
    int WaitingEntries)
{
    // A constant until its slice exists: nothing can start competition yet.
    public const string CompetitionPreparation = "preparation";

    // The only H1 profile (D-04): single round-robin, 3 / 1 / 0.
    public const string RoundRobinProfile = "singleRoundRobin-3-1-0";

    public static TournamentDetails Of(Tournament tournament, EntryCounts entries) => new(
        tournament.Id.Value,
        tournament.Revision,
        tournament.Publication,
        tournament.Registration,
        CompetitionPreparation,
        RoundRobinProfile,
        tournament.Configuration,
        tournament.Configuration.MissingForPublication(),
        tournament.Configuration.MissingForRegistration(),
        // The person is stored but not returned: Tournaments cannot name them (design W-1).
        tournament.RegistrationChangedAt,
        entries.Admitted,
        entries.Waiting);
}

internal static class TournamentResults
{
    public const string RevisionConflict = "tournament-revision-conflict";

    // The same answer for a tournament that does not exist and for another organisation's.
    public static IResult NotFound() => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");

    public static IResult Rejected(IReadOnlyList<BrokenRule> broken) => Results.ValidationProblem(
        broken.GroupBy(rule => rule.Field).ToDictionary(field => field.Key, field => field.Select(rule => rule.Rule).ToArray()));

    public static IResult Stale(int currentRevision) => Results.Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "Conflict",
        type: RevisionConflict,
        extensions: new Dictionary<string, object?> { ["currentRevision"] = currentRevision });

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
                return Stale(tournament.Revision);
            case WriteOutcome.Applied:
                try
                {
                    await db.SaveChangesAsync(cancellationToken);
                }
                catch (DbUpdateConcurrencyException)
                {
                    await db.Entry(tournament).ReloadAsync(cancellationToken);
                    return Stale(tournament.Revision);
                }

                if (tournament.Publication == Publication.Published)
                {
                    await bus.PublishAsync(EntryTerms(organisationId, tournament));
                }

                break;
        }

        return Results.Ok(TournamentDetails.Of(tournament, await db.EntryCountsAsync(tournament.Id, cancellationToken)));
    }

    // A published tournament is complete, so its entry terms are all present (R-5).
    public static TournamentEntryTermsChanged EntryTerms(Guid organisationId, Tournament tournament) => new(
        organisationId,
        tournament.Id.Value,
        tournament.Revision,
        tournament.Registration switch
        {
            RegistrationWindow.Open => RegistrationState.Open,
            RegistrationWindow.Closed => RegistrationState.Closed,
            _ => RegistrationState.NotOpen,
        },
        tournament.Configuration.Capacity!.Value,
        tournament.Configuration.EntryKind == Domain.EntryKind.Team ? Contract.EntryKind.Team : Contract.EntryKind.Individual,
        tournament.Configuration.Admission == Domain.Admission.Manual ? Contract.Admission.Manual : Contract.Admission.Automatic);

    public static bool IsDuplicateKey(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
