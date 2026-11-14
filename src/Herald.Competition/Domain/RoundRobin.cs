namespace Herald.Competition.Domain;

public sealed record Match(int Round, Guid First, Guid Second);

public sealed record Rest(int Round, Guid EntryId);

// A single round-robin by the circle method (D-04): the first entrant stays, the others rotate one place per round.
// An odd field gets an empty slot, and whoever meets it rests that round, so each entrant rests once.
public static class RoundRobin
{
    public static (IReadOnlyList<Match> Matches, IReadOnlyList<Rest> Rests) Pair(IReadOnlyList<Guid> seeded)
    {
        List<Guid?> slots = [.. seeded.Select(id => (Guid?)id)];
        if (slots.Count % 2 == 1)
        {
            slots.Add(null);
        }

        var n = slots.Count;
        var rotating = slots.Skip(1).ToList();
        List<Match> matches = [];
        List<Rest> rests = [];
        for (var round = 1; round < n; round++)
        {
            List<Guid?> line = [slots[0], .. rotating];
            for (var i = 0; i < n / 2; i++)
            {
                (var first, var second) = (line[i], line[n - 1 - i]);
                if (first is { } a && second is { } b)
                {
                    matches.Add(new(round, a, b));
                }
                else if ((first ?? second) is { } resting)
                {
                    rests.Add(new(round, resting));
                }
            }

            rotating.Insert(0, rotating[^1]);
            rotating.RemoveAt(rotating.Count - 1);
        }

        return (matches, rests);
    }

    // A Fisher–Yates shuffle driven by its own generator, so a recorded seed gives the same order on any runtime (AT-01).
    public static IReadOnlyList<T> Shuffle<T>(IReadOnlyList<T> items, int seed)
    {
        var result = items.ToList();
        var state = unchecked((uint)seed);
        for (var i = result.Count - 1; i > 0; i--)
        {
            state = unchecked(state * 1664525 + 1013904223);
            var j = (int)((state >> 8) % (uint)(i + 1));
            (result[i], result[j]) = (result[j], result[i]);
        }

        return result;
    }
}
