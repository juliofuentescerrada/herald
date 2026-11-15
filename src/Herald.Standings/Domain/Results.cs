using Herald.BuildingBlocks;

namespace Herald.Standings.Domain;

// The tournament's identifier, owned by the Tournaments module and opaque here.
public readonly record struct TournamentId(Guid Value);

// Who won a resolved match, a draw, or none for an outcome with no winner (a double absence, a no contest).
public enum Outcome
{
    First,
    Second,
    Draw,
    None,
}

public sealed record Entrant(Guid EntryId, string Name);

// A match as Competition reported it; Outcome and Cause are set once it is resolved, the only state that counts.
public sealed record MatchResult(Guid MatchId, int Round, Guid First, Guid Second, Outcome? Outcome, string? Cause)
{
    public bool IsResolved => Outcome is not null;
}

public sealed record Rest(int Round, Guid EntryId);

// One revision of a running competition's effective results (h1-standings D-1).
public sealed record ResultsSnapshot(int Revision, IReadOnlyList<Entrant> Entrants, IReadOnlyList<MatchResult> Matches, IReadOnlyList<Rest> Rests);

// The latest results Standings knows for a tournament; the table is computed from them on read (D-2).
public sealed class TournamentResults : AggregateRoot<TournamentId>
{
    // For EF Core, which sets the snapshot after constructing.
    private TournamentResults(TournamentId id)
        : base(id) => Snapshot = null!;

    private TournamentResults(TournamentId id, ResultsSnapshot snapshot)
        : base(id) => Snapshot = snapshot;

    public ResultsSnapshot Snapshot { get; private set; }

    public int Revision { get; private set; }

    public static TournamentResults Track(TournamentId id, ResultsSnapshot snapshot) => new(id, snapshot) { Revision = snapshot.Revision };

    // A newer snapshot replaces the results; an older or repeated one changes nothing (ADR 0016).
    public bool Apply(ResultsSnapshot snapshot)
    {
        if (snapshot.Revision <= Revision)
        {
            return false;
        }

        Snapshot = snapshot;
        Revision = snapshot.Revision;
        return true;
    }

    public Table Table() => Domain.Table.Of(Snapshot);
}
