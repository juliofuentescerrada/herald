using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;

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
    DateTimeOffset? RegistrationChangedAt)
{
    // A constant until its slice exists: nothing can start competition yet.
    public const string CompetitionPreparation = "preparation";

    // The only H1 profile (D-04): single round-robin, 3 / 1 / 0.
    public const string RoundRobinProfile = "singleRoundRobin-3-1-0";

    public static TournamentDetails Of(Tournament tournament) => new(
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
        tournament.RegistrationChangedAt);
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
    public static async Task<IResult> SavedAsync(this TournamentsDbContext db, Tournament tournament, WriteResult result, CancellationToken cancellationToken)
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

                break;
        }

        return Results.Ok(TournamentDetails.Of(tournament));
    }

    public static bool IsDuplicateKey(this DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
