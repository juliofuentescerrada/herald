using System.Text.Json;
using Herald.Competition.Domain;
using Herald.Contracts.Competition.V1;

namespace Herald.Competition.Features;

// The results Standings keeps, from the started pairings and their matches (h1-standings D-1).
internal static class ResultsSnapshot
{
    public static TournamentResultsChanged Of(Guid organisationId, Schedule schedule, IEnumerable<Match> matches)
    {
        var pairings = schedule.StartedPairings ?? throw new InvalidOperationException($"Tournament {schedule.Id.Value} has no started pairings.");
        return new(
            organisationId,
            schedule.Id.Value,
            schedule.ResultsRevision,
            [.. pairings.Entrants.Select(entrant => new ResultsEntrant(entrant.EntryId, entrant.Name))],
            [.. matches.OrderBy(match => match.Round).Select(Of)],
            [.. pairings.Rests.Select(rest => new ResultsRest(rest.Round, rest.EntryId))]);
    }

    // The cause crosses as a name, so causes added later need no new version.
    private static ResultsMatch Of(Match match) => new(
        match.Id.Value,
        match.Round,
        match.First,
        match.Second,
        Enum.Parse<ResultsMatchState>(match.State.ToString()),
        match.Resolution is { } resolution ? Enum.Parse<ResultOutcome>(resolution.Outcome.ToString()) : null,
        match.Resolution is { } cause ? JsonNamingPolicy.CamelCase.ConvertName(cause.Cause.ToString()) : null,
        match.Resolution?.Played);
}
