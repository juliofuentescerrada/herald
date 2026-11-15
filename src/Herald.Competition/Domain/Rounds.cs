namespace Herald.Competition.Domain;

public enum RoundState
{
    NotStarted,
    Running,
    Completed,
}

// A round's state is derived from its matches on read, so no write can leave it stale (h1-round-operations D-1).
// Rests are not matches and need no resolution.
public static class Rounds
{
    public static RoundState StateOf(IEnumerable<Match> matches)
    {
        var states = matches.Select(match => match.State).ToList();
        return states.TrueForAll(state => state == MatchState.Resolved) ? RoundState.Completed
            : states.TrueForAll(state => state == MatchState.Scheduled) ? RoundState.NotStarted
            : RoundState.Running;
    }

    public static IReadOnlyList<(int Round, RoundState State)> Of(IEnumerable<Match> matches) =>
        [.. matches.GroupBy(match => match.Round).OrderBy(round => round.Key).Select(round => (round.Key, StateOf(round)))];
}
