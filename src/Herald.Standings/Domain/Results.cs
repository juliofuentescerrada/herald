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

// Stored by number in the results document: append only. Snapshots kept before departures read as active.
public enum EntrantStatus
{
    Active,
    Withdrawn,
    Disqualified,
}

// A withdrawn or disqualified entrant keeps its points and position and is flagged (h1-round-operations).
public sealed record Entrant(Guid EntryId, string Name, EntrantStatus Status = EntrantStatus.Active);

// A match as Competition reported it; Outcome and Cause are set once it is resolved, the only state that counts. Revision is the
// match's own, null in snapshots kept before h1-safe-corrections.
public sealed record MatchResult(Guid MatchId, int Round, Guid First, Guid Second, Outcome? Outcome, string? Cause, int? Revision = null)
{
    public bool IsResolved => Outcome is not null;
}

public sealed record Rest(int Round, Guid EntryId);

// One revision of a running competition's effective results (h1-standings D-1).
public sealed record ResultsSnapshot(int Revision, IReadOnlyList<Entrant> Entrants, IReadOnlyList<MatchResult> Matches, IReadOnlyList<Rest> Rests);

// A finalisation Competition announced at a results revision; a reopening keeps it, marked (h1-finalisation D-4).
public sealed record FinalRevision(int Number, int ResultsRevision, DateTimeOffset FinalisedAt, bool Reopened = false);

// The latest results Standings knows for a tournament; the table is computed from them on read (D-2).
public sealed class TournamentResults : AggregateRoot<TournamentId>
{
    // For EF Core, which sets the snapshot after constructing.
    private TournamentResults(TournamentId id)
        : base(id) => Snapshot = null!;

    private TournamentResults(TournamentId id, ResultsSnapshot snapshot)
        : base(id) => Snapshot = snapshot;

    private List<FinalRevision> _finals = [];

    public ResultsSnapshot Snapshot { get; private set; }

    public int Revision { get; private set; }

    public IReadOnlyList<FinalRevision> Finals
    {
        get => _finals;
        private set => _finals = [.. value];
    }

    // The current final revision, once the results it was taken at are the ones applied here: an older table is never final.
    public FinalRevision? Final => _finals.Count > 0 && _finals[^1] is { Reopened: false } final && final.ResultsRevision == Revision ? final : null;

    // Final standings where every entrant departed declare no champion (h1-finalisation D-5).
    public bool NoChampion => Final is not null && Snapshot.Entrants.All(entrant => entrant.Status != EntrantStatus.Active);

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

    // Idempotent on the final revision number, whichever of the finalisation and its reopening arrives first (ADR 0016).
    public bool Finalise(int number, int resultsRevision, DateTimeOffset at)
    {
        if (_finals.Exists(final => final.Number == number))
        {
            return false;
        }

        _finals.Add(new(number, resultsRevision, at));
        _finals.Sort((left, right) => left.Number.CompareTo(right.Number));
        return true;
    }

    public bool Reopen(int number, int resultsRevision, DateTimeOffset at)
    {
        var index = _finals.FindIndex(final => final.Number == number);
        if (index >= 0 && _finals[index].Reopened)
        {
            return false;
        }

        if (index < 0)
        {
            Finalise(number, resultsRevision, at);
            index = _finals.FindIndex(final => final.Number == number);
        }

        _finals[index] = _finals[index] with { Reopened = true };
        return true;
    }

    public Table Table() => Domain.Table.Of(Snapshot);

    // The table with one match's resolution replaced, over the results applied here, changing nothing (h1-safe-corrections D-3).
    // Null for a match these results do not hold; "updating" when they hold another revision of it than the one reviewed.
    // shortcut: snapshots kept before match revisions crossed read as updating until the tournament's next result.
    public CorrectionPreview? Preview(Guid matchId, int matchRevision, Outcome outcome, string cause)
    {
        if (Snapshot.Matches.FirstOrDefault(match => match.MatchId == matchId) is not { } held)
        {
            return null;
        }

        if (held.Revision != matchRevision)
        {
            return new(Revision, held.Revision, true, []);
        }

        var before = Table().Rows.ToDictionary(row => row.Entrant.EntryId);
        var after = Domain.Table.Of(Snapshot with
        {
            Matches = [.. Snapshot.Matches.Select(match => match.MatchId == matchId ? match with { Outcome = outcome, Cause = cause } : match)],
        });

        // The match's entrants, and any other whose points or position change.
        return new(Revision, held.Revision, false, [.. after.Rows
            .Select(row => (Before: before[row.Entrant.EntryId], After: row))
            .Where(pair => pair.After.Entrant.EntryId == held.First || pair.After.Entrant.EntryId == held.Second
                || (pair.Before.Points, pair.Before.Position, pair.Before.Shared) != (pair.After.Points, pair.After.Position, pair.After.Shared))
            .Select(pair => new PreviewLine(
                pair.After.Entrant, pair.Before.Points, pair.After.Points, pair.Before.Position, pair.Before.Shared, pair.After.Position, pair.After.Shared))]);
    }
}

// An entrant's points and position before and after a proposed correction.
public sealed record PreviewLine(Entrant Entrant, int PointsBefore, int PointsAfter, int PositionBefore, bool SharedBefore, int PositionAfter, bool SharedAfter);

// A correction's impact over results revision Revision, or Updating when these results hold another revision of the match.
public sealed record CorrectionPreview(int Revision, int? MatchRevision, bool Updating, IReadOnlyList<PreviewLine> Entrants);
