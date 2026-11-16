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
    Resolved,
}

// Who won, a draw, or no winner (a double absence or a no contest, 0 each); the loser's result is derived (h1-operator-results A-2).
// Stored by number in the resolution document: append only.
public enum Outcome
{
    First,
    Second,
    Draw,
    None,
}

// Why a match is resolved (h1-exceptional-outcomes D-1). Stored by number in the resolution document: append only.
public enum Cause
{
    Played,
    Concession,
    SingleAbsence,
    DoubleAbsence,
    NoContest,
}

// One recorded lineup of a side: the players chosen from the frozen roster, kept for good once recorded (design D-2).
public sealed record Lineup(int Number, IReadOnlyList<Guid> Players, Guid RecordedBy, DateTimeOffset RecordedAt);

// Who started the match and when, with the lineup numbers it locked; a lock records intended starters, not appearances.
public sealed record MatchStart(Guid StartedBy, DateTimeOffset StartedAt, int? FirstLineup, int? SecondLineup);

// The one effective result of a match (h1-operator-results D-1), with the players credited with an appearance (D-2).
// A departure's single absence revised to a double absence keeps it as its predecessor (h1-round-operations D-2).
public sealed record Resolution(
    Outcome Outcome,
    Cause Cause,
    bool Played,
    IReadOnlyList<Guid> Appearances,
    Guid RecordedBy,
    DateTimeOffset RecordedAt,
    Guid OperationId,
    string? Reason = null,
    Resolution? Predecessor = null);

// A resolution replaced by a correction, with who replaced it, when, why, by which operation and the match revision it was
// effective at (h1-safe-corrections D-1, ADR 0007).
public sealed record ReplacedResolution(Resolution Resolution, Guid ReplacedBy, DateTimeOffset ReplacedAt, string Reason, Guid OperationId, int MatchRevision = 0);

public sealed record MatchResolved(MatchId MatchId, Outcome Outcome, Cause Cause, Guid RecordedBy, DateTimeOffset RecordedAt) : IDomainEvent;

public sealed record ResultCorrected(MatchId MatchId, Outcome Outcome, Cause Cause, Guid CorrectedBy, DateTimeOffset CorrectedAt) : IDomainEvent;

public sealed record LineupRecorded(MatchId MatchId, Side Side, int Number, Guid RecordedBy, DateTimeOffset RecordedAt) : IDomainEvent;

public sealed record MatchStarted(MatchId MatchId, Guid StartedBy, DateTimeOffset StartedAt) : IDomainEvent;

// A pairing of the started schedule revision, prepared and started on its own (h1-match-lineups D-1 to D-3).
public sealed class Match : AggregateRoot<MatchId>
{
    private List<Lineup> _firstLineups = [];
    private List<Lineup> _secondLineups = [];
    private List<ReplacedResolution> _replacedResolutions = [];

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

    public Resolution? Resolution { get; private set; }

    // Oldest first; the effective resolution is never among them.
    public IReadOnlyList<ReplacedResolution> ReplacedResolutions
    {
        get => _replacedResolutions;
        private set => _replacedResolutions = [.. value];
    }

    public MatchState State => Resolution is not null ? MatchState.Resolved : Start is null ? MatchState.Scheduled : MatchState.InPlay;

    // shortcut: a team start reported without its lineup size (a message from before h1-match-lineups) schedules
    // individual matches; no such message exists outside local databases, so revisit only if one is found.
    public bool IsTeamMatch => ActivePlayers is not null;

    public static Match Schedule(TournamentId tournamentId, Pairing pairing, int? activePlayers) =>
        new(new MatchId(Guid.NewGuid()), tournamentId, pairing, activePlayers);

    public Lineup? CurrentLineup(Side side) => Lineups(side) is { Count: > 0 } list ? list[^1] : null;

    public Guid EntryOf(Side side) => side == Side.First ? First : Second;

    // The roster is the side's frozen roster, or null while Competition has not learned it (D-4); unavailable players are the
    // withdrawn and sanctioned ones (h1-round-operations D-3).
    public WriteResult RecordLineup(
        Side side, IReadOnlyList<Guid> players, IReadOnlyCollection<Guid>? roster, int expectedRevision, Guid actor, DateTimeOffset at, IReadOnlyCollection<Guid>? unavailable = null)
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

        if (Check(players, roster, unavailable) is { Count: > 0 } broken)
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
    public IReadOnlyList<BrokenRule> StartBlockers(IReadOnlyCollection<Guid>? firstRoster, IReadOnlyCollection<Guid>? secondRoster, IReadOnlyCollection<Guid>? unavailable = null)
    {
        if (!IsTeamMatch)
        {
            return [];
        }

        List<BrokenRule> broken = [];
        foreach ((var side, var roster) in new[] { (Side.First, firstRoster), (Side.Second, secondRoster) })
        {
            var field = side == Side.First ? "first-lineup" : "second-lineup";
            // Too few eligible players: the match waits for the owner's explicit outcome (h1-round-operations D-3).
            if (roster is not null && roster.Count(player => unavailable?.Contains(player) != true) < ActivePlayers)
            {
                broken.Add(new(side == Side.First ? "first-roster" : "second-roster", "too-few-eligible"));
            }

            if (CurrentLineup(side) is not { } lineup)
            {
                broken.Add(new(field, "missing"));
            }
            else
            {
                broken.AddRange(Check(lineup.Players, roster, unavailable).Select(rule => rule with { Field = field }));
            }
        }

        if (CurrentLineup(Side.First) is { } first && CurrentLineup(Side.Second) is { } second && first.Players.Intersect(second.Players).Any())
        {
            broken.Add(new("players", "both-sides"));
        }

        // Each side's rule once, however many of its players break it.
        return [.. broken.Distinct()];
    }

    public WriteResult StartMatch(
        IReadOnlyCollection<Guid>? firstRoster, IReadOnlyCollection<Guid>? secondRoster, int expectedRevision, Guid actor, DateTimeOffset at, IReadOnlyCollection<Guid>? unavailable = null)
    {
        if (Start is not null)
        {
            return WriteOutcome.Repeated;
        }

        // An administrative outcome resolves a match without starting it; a start afterwards would invent start evidence (D-2).
        if (Resolution is not null)
        {
            return WriteResult.Reject("match", "resolved");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartBlockers(firstRoster, secondRoster, unavailable) is { Count: > 0 } broken)
        {
            // The rejection also names each unavailable starter (h1-round-operations D-3).
            var named = new[] { Side.First, Side.Second }.SelectMany(side => CurrentLineup(side)?.Players ?? [])
                .Where(player => unavailable?.Contains(player) == true).Distinct().Select(player => new BrokenRule($"player-{player}", "unavailable"));
            return new(WriteOutcome.Rejected, [.. broken, .. named]);
        }

        Start = new(actor, at, CurrentLineup(Side.First)?.Number, CurrentLineup(Side.Second)?.Number);
        Raise(new MatchStarted(Id, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // A played result; an individual match not yet started starts with it, a team match must be in play (h1-operator-results D-1).
    public WriteResult RecordPlayed(Guid operationId, Outcome outcome, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Resolved(operationId))
        {
            return WriteOutcome.Repeated;
        }

        // Before the revision, so a second result from a stale tab hears that the match is already resolved.
        if (Resolution is not null)
        {
            return WriteResult.Reject("match", "resolved");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        // The API also binds integers to the enum: only a winner or a draw becomes the one played result.
        if (!Enum.IsDefined(outcome) || outcome == Outcome.None)
        {
            return WriteResult.Reject("outcome", "unknown");
        }

        if (IsTeamMatch && Start is null)
        {
            return WriteResult.Reject("match", "not-started");
        }

        if (Start is null)
        {
            Start = new(actor, at, null, null);
            Raise(new MatchStarted(Id, actor, at));
        }

        Resolution = new(outcome, Cause.Played, true, Appearances(), actor, at, operationId);
        Raise(new MatchResolved(Id, outcome, Cause.Played, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    public const int ReasonLength = 500;

    // A concession, an absence or a no contest (h1-exceptional-outcomes D-1, D-2). The entrant is the conceding or absent side;
    // played states whether play took place, which an absence never records. None of them starts the match.
    public WriteResult RecordAdministrative(
        Guid operationId, Cause cause, Side? entrant, bool? played, string? reason, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Resolved(operationId))
        {
            return WriteOutcome.Repeated;
        }

        if (Resolution is not null)
        {
            return WriteResult.Reject("match", "resolved");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        // A played result is RecordPlayed's.
        if (cause == Cause.Played)
        {
            return WriteResult.Reject("cause", "unknown");
        }

        var (broken, outcome, tookPlace, noContestReason, _) = Propose(cause, null, entrant, played, reason);
        if (broken.Count > 0)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        Resolution = new(outcome, cause, tookPlace, tookPlace ? Appearances() : [], actor, at, operationId, noContestReason);
        Raise(new MatchResolved(Id, outcome, cause, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // Replaces the effective resolution, keeping the replaced one with who, when and why (h1-safe-corrections D-1, D-2). The input is
    // a result's: the outcome of a played one, the conceding or absent entrant, whether play took place and a no contest's reason.
    public WriteResult Correct(
        Guid operationId, Cause cause, Outcome? outcome, Side? entrant, bool? played, string? noContestReason, string? reason,
        int expectedRevision, Guid actor, DateTimeOffset at)
    {
        var proposal = Propose(cause, outcome, entrant, played, noContestReason);
        if (_replacedResolutions.FindIndex(replaced => replaced.OperationId == operationId) is var index and >= 0)
        {
            // A retry returns what that correction produced; the same operation with other content conflicts.
            var produced = index + 1 < _replacedResolutions.Count ? _replacedResolutions[index + 1].Resolution : Resolution!;
            return proposal.Broken.Count == 0 && Same(produced, proposal) && _replacedResolutions[index].Reason == reason?.Trim()
                ? WriteOutcome.Repeated
                : WriteOutcome.Stale;
        }

        if (Resolution is not { } current)
        {
            return WriteResult.Reject("match", "not-resolved");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        reason = reason?.Trim();
        List<BrokenRule> broken = [.. proposal.Broken];
        if (string.IsNullOrEmpty(reason))
        {
            broken.Add(new("correction-reason", "required"));
        }
        else if (reason.Length > ReasonLength)
        {
            broken.Add(new("correction-reason", "too-long"));
        }

        // Recorded play is never erased (§8.1).
        if (current.Played && !proposal.TookPlace)
        {
            broken.Add(new("played", "recorded"));
        }

        if (broken.Count == 0 && Same(current, proposal))
        {
            broken.Add(new("resolution", "unchanged"));
        }

        if (broken.Count > 0)
        {
            return new(WriteOutcome.Rejected, broken);
        }

        _replacedResolutions.Add(new(current, actor, at, reason!, operationId, Revision));
        // A played result starts an individual match that never started, as recording one does (D-2).
        if (proposal.TookPlace && Start is null)
        {
            Start = new(actor, at, null, null);
            Raise(new MatchStarted(Id, actor, at));
        }

        var appearances = current.Played ? current.Appearances : proposal.TookPlace ? Appearances() : [];
        Resolution = new(proposal.Outcome, cause, proposal.TookPlace, appearances, actor, at, operationId, proposal.NoContestReason);
        Raise(new ResultCorrected(Id, proposal.Outcome, cause, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // This operation resolved the match, whether its resolution is still effective or was corrected since (match-results: A double submission).
    private bool Resolved(Guid operationId) =>
        Resolution?.OperationId == operationId || _replacedResolutions.Exists(replaced => replaced.Resolution.OperationId == operationId);

    private sealed record Proposal(List<BrokenRule> Broken, Outcome Outcome, bool TookPlace, string? NoContestReason, Cause Cause);

    private static bool Same(Resolution resolution, Proposal proposal) =>
        (resolution.Outcome, resolution.Cause, resolution.Played, resolution.Reason) == (proposal.Outcome, proposal.Cause, proposal.TookPlace, proposal.NoContestReason);

    // The §8.1 rules of a result against this match's start (h1-exceptional-outcomes D-1, D-2): the outcome a cause gives, whether
    // play took place and the no contest's reason. The outcome is a played result's only.
    private Proposal Propose(Cause cause, Outcome? outcome, Side? entrant, bool? played, string? reason)
    {
        reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        List<BrokenRule> broken = [];
        switch (cause)
        {
            // The API also binds integers to the enum: only a winner or a draw becomes a played result.
            case Cause.Played when outcome is not { } won || !Enum.IsDefined(won) || won == Outcome.None:
                broken.Add(new("outcome", outcome is null ? "required" : "unknown"));
                break;
            case Cause.Concession or Cause.SingleAbsence when entrant is not { } side || !Enum.IsDefined(side):
                broken.Add(new("entrant", "required"));
                break;
            case Cause.NoContest when reason is null:
                broken.Add(new("reason", "required"));
                break;
            case Cause.NoContest when reason?.Length > ReasonLength:
                broken.Add(new("reason", "too-long"));
                break;
            case Cause.Played or Cause.Concession or Cause.SingleAbsence or Cause.DoubleAbsence or Cause.NoContest:
                break;
            default:
                return new([new("cause", "unknown")], Outcome.None, false, null, cause);
        }

        var absence = cause is Cause.SingleAbsence or Cause.DoubleAbsence;
        if (cause is not (Cause.Played or Cause.SingleAbsence or Cause.DoubleAbsence) && played is null)
        {
            broken.Add(new("played", "required"));
        }

        if (absence && Start is not null)
        {
            broken.Add(new("match", "started"));
        }

        var tookPlace = cause == Cause.Played || (!absence && played == true);
        if (tookPlace && IsTeamMatch && Start is null)
        {
            broken.Add(new("match", "not-started"));
        }

        // The other side of the conceding or absent entrant wins; a double absence and a no contest have no winner.
        var result = cause switch
        {
            Cause.Played => outcome ?? Outcome.None,
            Cause.Concession or Cause.SingleAbsence => entrant == Side.First ? Outcome.Second : Outcome.First,
            _ => Outcome.None,
        };
        return new(broken, result, tookPlace, cause == Cause.NoContest ? reason : null, cause);
    }

    // Resolves this match for the departing side's entrant (h1-round-operations D-2); false when nothing changes. The opponent's
    // departure, when it departed first, is its operation: its own single absence is revised once to a double absence. Any other
    // resolution stays, a played one above all.
    public bool ResolveForDeparture(Guid operationId, Side side, Guid? opponentDeparture, Guid actor, DateTimeOffset at)
    {
        if (Resolution is { } resolution)
        {
            if (resolution.Cause != Cause.SingleAbsence || resolution.OperationId != opponentDeparture)
            {
                return false;
            }

            Resolution = new(Outcome.None, Cause.DoubleAbsence, false, [], actor, at, operationId, Predecessor: resolution);
        }
        else if (Start is not null)
        {
            // In play: a concession after play, crediting the locked lineups.
            Resolution = new(side == Side.First ? Outcome.Second : Outcome.First, Cause.Concession, true, Appearances(), actor, at, operationId);
        }
        else
        {
            Resolution = opponentDeparture is null
                ? new(side == Side.First ? Outcome.Second : Outcome.First, Cause.SingleAbsence, false, [], actor, at, operationId)
                : new(Outcome.None, Cause.DoubleAbsence, false, [], actor, at, operationId);
        }

        Raise(new MatchResolved(Id, Resolution.Outcome, Resolution.Cause, actor, at));
        Revision++;
        return true;
    }

    // The players of the two locked lineups; none for an individual match, whose entrant is the player (D-2).
    private List<Guid> Appearances() => IsTeamMatch && Start is { } start
        ? [.. LockedPlayers(Side.First, start.FirstLineup), .. LockedPlayers(Side.Second, start.SecondLineup)]
        : [];

    private IEnumerable<Guid> LockedPlayers(Side side, int? number) => Lineups(side).Find(lineup => lineup.Number == number)?.Players ?? [];

    private List<Lineup> Lineups(Side side) => side == Side.First ? _firstLineups : _secondLineups;

    private List<BrokenRule> Check(IReadOnlyList<Guid> players, IReadOnlyCollection<Guid>? roster, IReadOnlyCollection<Guid>? unavailable)
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
        broken.AddRange(players.Where(player => unavailable?.Contains(player) == true).Distinct().Select(player => new BrokenRule($"player-{player}", "unavailable")));

        return broken;
    }
}
