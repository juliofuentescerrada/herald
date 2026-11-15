using Herald.BuildingBlocks;

namespace Herald.Competition.Domain;

public readonly record struct MatchId(Guid Value);

public enum Side
{
    First,
    Second,
}

public enum MatchState
{
    Scheduled,
    InPlay,
}

// One recorded lineup of a side: the players chosen from the frozen roster, kept for good once recorded (design D-2).
public sealed record Lineup(int Number, IReadOnlyList<Guid> Players, Guid RecordedBy, DateTimeOffset RecordedAt);

// Who started the match and when, with the lineup numbers it locked; a lock records intended starters, not appearances.
public sealed record MatchStart(Guid StartedBy, DateTimeOffset StartedAt, int? FirstLineup, int? SecondLineup);

public sealed record LineupRecorded(MatchId MatchId, Side Side, int Number, Guid RecordedBy, DateTimeOffset RecordedAt) : IDomainEvent;

public sealed record MatchStarted(MatchId MatchId, Guid StartedBy, DateTimeOffset StartedAt) : IDomainEvent;

// A pairing of the started schedule revision, prepared and started on its own (h1-match-lineups D-1 to D-3).
public sealed class Match : AggregateRoot<MatchId>
{
    private List<Lineup> _firstLineups = [];
    private List<Lineup> _secondLineups = [];

    // For EF Core, which sets the other properties after constructing.
    private Match(MatchId id)
        : base(id)
    {
    }

    private Match(MatchId id, TournamentId tournamentId, Pairing pairing, int? activePlayers)
        : base(id)
    {
        TournamentId = tournamentId;
        Round = pairing.Round;
        First = pairing.First;
        Second = pairing.Second;
        ActivePlayers = activePlayers;
    }

    public TournamentId TournamentId { get; private set; }

    public int Round { get; private set; }

    public Guid First { get; private set; }

    public Guid Second { get; private set; }

    // The profile's players per side for a team match; null for an individual one.
    public int? ActivePlayers { get; private set; }

    public int Revision { get; private set; } = 1;

    public IReadOnlyList<Lineup> FirstLineups
    {
        get => _firstLineups;
        private set => _firstLineups = [.. value];
    }

    public IReadOnlyList<Lineup> SecondLineups
    {
        get => _secondLineups;
        private set => _secondLineups = [.. value];
    }

    public MatchStart? Start { get; private set; }

    public MatchState State => Start is null ? MatchState.Scheduled : MatchState.InPlay;

    // shortcut: a team start reported without its lineup size (a message from before h1-match-lineups) schedules
    // individual matches; no such message exists outside local databases, so revisit only if one is found.
    public bool IsTeamMatch => ActivePlayers is not null;

    public static Match Schedule(TournamentId tournamentId, Pairing pairing, int? activePlayers) =>
        new(new MatchId(Guid.NewGuid()), tournamentId, pairing, activePlayers);

    public Lineup? CurrentLineup(Side side) => Lineups(side) is { Count: > 0 } list ? list[^1] : null;

    public Guid EntryOf(Side side) => side == Side.First ? First : Second;

    // The roster is the side's frozen roster, or null while Competition has not learned it (D-4).
    public WriteResult RecordLineup(Side side, IReadOnlyList<Guid> players, IReadOnlyCollection<Guid>? roster, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (!IsTeamMatch)
        {
            return WriteResult.Reject("match", "individual");
        }

        if (State == MatchState.Scheduled && CurrentLineup(side) is { } current && current.Players.Order().SequenceEqual(players.Order()))
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (State != MatchState.Scheduled)
        {
            return WriteResult.Reject("match", "started");
        }

        if (Check(players, roster) is { Count: > 0 } broken)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        var list = Lineups(side);
        var lineup = new Lineup(list.Count + 1, [.. players], actor, at);
        list.Add(lineup);
        Raise(new LineupRecorded(Id, side, lineup.Number, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // The reasons this match cannot start now, side by side; the rosters are null while unknown.
    public IReadOnlyList<BrokenRule> StartBlockers(IReadOnlyCollection<Guid>? firstRoster, IReadOnlyCollection<Guid>? secondRoster)
    {
        if (!IsTeamMatch)
        {
            return [];
        }

        List<BrokenRule> broken = [];
        foreach ((var side, var roster) in new[] { (Side.First, firstRoster), (Side.Second, secondRoster) })
        {
            var field = side == Side.First ? "first-lineup" : "second-lineup";
            if (CurrentLineup(side) is not { } lineup)
            {
                broken.Add(new(field, "missing"));
            }
            else
            {
                broken.AddRange(Check(lineup.Players, roster).Select(rule => rule with { Field = field }));
            }
        }

        if (CurrentLineup(Side.First) is { } first && CurrentLineup(Side.Second) is { } second && first.Players.Intersect(second.Players).Any())
        {
            broken.Add(new("players", "both-sides"));
        }

        return broken;
    }

    public WriteResult StartMatch(IReadOnlyCollection<Guid>? firstRoster, IReadOnlyCollection<Guid>? secondRoster, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Start is not null)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartBlockers(firstRoster, secondRoster) is { Count: > 0 } broken)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        Start = new(actor, at, CurrentLineup(Side.First)?.Number, CurrentLineup(Side.Second)?.Number);
        Raise(new MatchStarted(Id, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    private List<Lineup> Lineups(Side side) => side == Side.First ? _firstLineups : _secondLineups;

    private List<BrokenRule> Check(IReadOnlyList<Guid> players, IReadOnlyCollection<Guid>? roster)
    {
        if (roster is null)
        {
            return [new("roster", "unknown")];
        }

        List<BrokenRule> broken = [];
        if (players.Count != ActivePlayers)
        {
            broken.Add(new("players", "count"));
        }

        if (players.Distinct().Count() != players.Count)
        {
            broken.Add(new("players", "duplicate"));
        }

        // One rule per player, so the rejection names each of them.
        broken.AddRange(players.Where(player => !roster.Contains(player)).Distinct().Select(player => new BrokenRule($"player-{player}", "not-on-roster")));

        return broken;
    }
}
