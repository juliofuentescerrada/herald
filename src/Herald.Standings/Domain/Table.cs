namespace Herald.Standings.Domain;

// A line of an entrant's explanation: a resolved match with its opponent, cause, outcome seen from the entrant (First a win,
// Second a loss) and points, or a rest (Opponent, Cause and Outcome null).
public sealed record Line(int Round, Entrant? Opponent, string? Cause, Outcome? Outcome, int Points)
{
    public bool IsRest => Opponent is null;
}

public sealed record Row(int Position, bool Shared, Entrant Entrant, int Resolved, int Won, int Drawn, int Lost, int Points, IReadOnlyList<Line> Lines);

// The standings under 3/1/0 from effective results only (D-04, F-09); positions shared on equal points.
public sealed record Table(int Revision, int ResolvedMatches, int Matches, IReadOnlyList<Row> Rows)
{
    public const int Win = 3;
    public const int Draw = 1;

    public static Table Of(ResultsSnapshot results)
    {
        var names = results.Entrants.ToDictionary(entrant => entrant.EntryId);
        var resolved = results.Matches.Where(match => match.IsResolved).ToList();
        var rows = results.Entrants
            .Select(entrant => RowOf(entrant, resolved, results.Rests, names))
            // Within equal points by name: presentation, not a tiebreaker (A-2).
            .OrderByDescending(row => row.Points)
            .ThenBy(row => row.Entrant.Name, StringComparer.InvariantCulture)
            .ToList();

        // Equal points share the position of the first of them; the next position skips (1, 2, 2, 4).
        var ranked = rows.Select((row, index) => row with
        {
            Position = rows.FindIndex(other => other.Points == row.Points) + 1,
            Shared = rows.Count(other => other.Points == row.Points) > 1,
        });
        return new(results.Revision, resolved.Count, results.Matches.Count, [.. ranked]);
    }

    private static Row RowOf(Entrant entrant, List<MatchResult> resolved, IReadOnlyList<Rest> rests, Dictionary<Guid, Entrant> names)
    {
        var lines = resolved
            .Where(match => match.First == entrant.EntryId || match.Second == entrant.EntryId)
            .Select(match =>
            {
                var first = match.First == entrant.EntryId;
                var outcome = first ? match.Outcome : Mirror(match.Outcome!.Value);
                return new Line(match.Round, names[first ? match.Second : match.First], match.Cause, outcome, PointsFor(outcome!.Value));
            })
            .Concat(rests.Where(rest => rest.EntryId == entrant.EntryId).Select(rest => new Line(rest.Round, null, null, null, 0)))
            .OrderBy(line => line.Round)
            .ToList();
        var matches = lines.Where(line => !line.IsRest).ToList();
        return new(
            0,
            false,
            entrant,
            matches.Count,
            matches.Count(line => line.Outcome == Outcome.First),
            matches.Count(line => line.Outcome == Outcome.Draw),
            matches.Count(line => line.Outcome == Outcome.Second),
            lines.Sum(line => line.Points),
            lines);
    }

    // The outcome seen from the entrant: First is a win for it, Second a loss.
    private static Outcome Mirror(Outcome outcome) => outcome switch
    {
        Outcome.First => Outcome.Second,
        Outcome.Second => Outcome.First,
        _ => outcome,
    };

    // A win 3, a draw 1 each, an outcome with no winner 0 each and in none of wins, draws and losses (Q1).
    private static int PointsFor(Outcome outcome) => outcome switch
    {
        Outcome.First => Win,
        Outcome.Draw => Draw,
        _ => 0,
    };
}
