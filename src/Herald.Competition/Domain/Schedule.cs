using Herald.BuildingBlocks;

namespace Herald.Competition.Domain;

// The tournament's identifier, owned by the Tournaments module and opaque here.
public readonly record struct TournamentId(Guid Value);

public enum Seeding
{
    AdmissionOrder,
    Draw,
}

public sealed record Entrant(Guid EntryId, string Name, int AdmissionOrder);

public sealed record PendingEntrant(Guid EntryId, string Name);

// The eligible field as Registration last reported it (D-2); entrants are in admission order.
public sealed record EligibleField(int Revision, bool RegistrationClosed, IReadOnlyList<PendingEntrant> Pending, IReadOnlyList<Entrant> Entrants);

// A draft or published set of pairings, with the field and seeding it came from.
public sealed record Pairings(Seeding Seeding, int? Seed, int EligibleRevision, IReadOnlyList<Entrant> Entrants, IReadOnlyList<Pairing> Matches, IReadOnlyList<Rest> Rests);

// OperationId lets a retried generation return the same draft (D-8); a draft returned by a withdrawal has none.
public sealed record Draft(Guid? OperationId, Pairings Pairings, Guid GeneratedBy, DateTimeOffset GeneratedAt);

// Kept for good once published (ADR 0007); a withdrawal adds its reason, who and when.
public sealed record Publication(
    int Number,
    Pairings Pairings,
    Guid PublishedBy,
    DateTimeOffset PublishedAt,
    string? WithdrawalReason = null,
    Guid? WithdrawnBy = null,
    DateTimeOffset? WithdrawnAt = null)
{
    public bool IsWithdrawn => WithdrawnAt is not null;
}

// A team entry's roster frozen at start, as Registration reported it (h1-match-lineups D-4).
public sealed record FrozenRoster(Guid EntryId, int Revision, IReadOnlyList<RosterPlayer> Players);

public sealed record RosterPlayer(Guid PlayerId, string Name);

public sealed record FrozenRosters(int Revision, IReadOnlyList<FrozenRoster> Teams);

// Revision is the schedule's revision after the change: the fact's subject revision (ADR 0007, ADR 0017).
public sealed record PlayerWithdrawal(string? Reason, Guid WithdrawnBy, DateTimeOffset WithdrawnAt, int Revision);

public sealed record PlayerSanction(
    string Reason, Guid SanctionedBy, DateTimeOffset SanctionedAt, int Revision, Guid? LiftedBy = null, DateTimeOffset? LiftedAt = null, int? LiftRevision = null)
{
    public bool IsActive => LiftedAt is null;
}

// A frozen-roster player's withdrawal and sanctions, kept for good (h1-round-operations D-3). Kept apart from the rosters, which
// Registration's reports replace.
public sealed record PlayerAvailability(Guid EntryId, Guid PlayerId, PlayerWithdrawal? Withdrawal, IReadOnlyList<PlayerSanction> Sanctions)
{
    public bool IsUnavailable => Withdrawal is not null || Sanctions.Any(sanction => sanction.IsActive);
}

// What changed between the field a set of pairings came from and the current one (D-5).
public sealed record FieldChange(IReadOnlyList<Entrant> Added, IReadOnlyList<Entrant> Removed);

// An entrant's competitive status (h1-round-operations D-2). Stored by number in the departures document: append only.
public enum EntrantStatus
{
    Active,
    Withdrawn,
    Disqualified,
}

// A withdrawal or disqualification of an entrant after start, final in H1; the reason is the organisation's own (A-1).
// Revision is the schedule's revision after the departure (ADR 0007, ADR 0017).
public sealed record Departure(Guid EntryId, EntrantStatus Status, string Reason, Guid DepartedBy, DateTimeOffset DepartedAt, Guid OperationId, int Revision);

// A finalisation of the competition at a results revision, kept for good; a reopening adds its reason, who and when (h1-finalisation D-1, D-3).
public sealed record FinalRevision(
    int Number, int ResultsRevision, Guid FinalisedBy, DateTimeOffset FinalisedAt, string? ReopenReason = null, Guid? ReopenedBy = null, DateTimeOffset? ReopenedAt = null)
{
    public bool IsReopened => ReopenedAt is not null;
}

public sealed record CompetitionFinalised(TournamentId TournamentId, int Number, int ResultsRevision, Guid FinalisedBy, DateTimeOffset FinalisedAt) : IDomainEvent;

public sealed record CompetitionReopened(TournamentId TournamentId, int Number, int ResultsRevision, Guid ReopenedBy, DateTimeOffset ReopenedAt) : IDomainEvent;

public sealed record EntrantDeparted(TournamentId TournamentId, Guid EntryId, EntrantStatus Status, Guid DepartedBy, DateTimeOffset DepartedAt) : IDomainEvent;

public sealed record DraftGenerated(TournamentId TournamentId, Seeding Seeding, int? Seed, int EligibleRevision, Guid GeneratedBy, DateTimeOffset GeneratedAt) : IDomainEvent;

public sealed record SchedulePublished(TournamentId TournamentId, int Number, Guid PublishedBy, DateTimeOffset PublishedAt) : IDomainEvent;

public sealed record ScheduleWithdrawn(TournamentId TournamentId, int Number, string Reason, Guid WithdrawnBy, DateTimeOffset WithdrawnAt) : IDomainEvent;

// One tournament's round-robin: the eligible field, at most one draft and the published revisions (D-1).
public sealed class Schedule : AggregateRoot<TournamentId>
{
    public const int ReasonMaxLength = 500;

    private List<Publication> _publications = [];
    private List<Departure> _departures = [];
    private List<PlayerAvailability> _players = [];
    private List<FinalRevision> _finals = [];

    // For EF Core, which sets the field after constructing.
    private Schedule(TournamentId id)
        : base(id) => Field = null!;

    private Schedule(TournamentId id, EligibleField field)
        : base(id) => Field = field;

    public EligibleField Field { get; private set; }

    // Starts at 1 and grows by one with each change; writes state it and Tournaments keeps the highest (D-4, D-8).
    public int Revision { get; private set; } = 1;

    public Draft? Draft { get; private set; }

    public IReadOnlyList<Publication> Publications
    {
        get => _publications;
        private set => _publications = [.. value];
    }

    public IReadOnlyList<Departure> Departures
    {
        get => _departures;
        private set => _departures = [.. value];
    }

    public IReadOnlyList<PlayerAvailability> Players
    {
        get => _players;
        private set => _players = [.. value];
    }

    public IReadOnlyList<FinalRevision> Finals
    {
        get => _finals;
        private set => _finals = [.. value];
    }

    // The current final revision; null while the competition is not finalised.
    public FinalRevision? Final => _finals.Count > 0 && !_finals[^1].IsReopened ? _finals[^1] : null;

    public bool IsFinalised => Final is not null;

    // The frozen-roster players who cannot be in a lineup now, across the tournament's teams.
    public IReadOnlyCollection<Guid> UnavailablePlayers => _players.Where(player => player.IsUnavailable).Select(player => player.PlayerId).ToHashSet();

    public Publication? Current => _publications.LastOrDefault(publication => !publication.IsWithdrawn);

    // The published revision the competition started on, and when Competition learned of it (h1-competition-start D-3).
    public int? StartedOnRevision { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    // The profile's players per side, fixed at start; null for an individual tournament (h1-match-lineups D-4).
    public int? ActivePlayersPerSide { get; private set; }

    // The revision of the results Standings keeps: 1 once the matches are scheduled, one more for each resolution
    // (h1-standings D-1); 0 before.
    public int ResultsRevision { get; private set; }

    // Null until Registration reports the frozen rosters of a team tournament.
    public FrozenRosters? Rosters { get; private set; }

    // The pairings the matches come from: the started revision, or after a crossed withdrawal the revision published
    // after start (h1-match-lineups D-1). Null before start and while no revision is current.
    public Pairings? StartedPairings => StartedAt is null ? null : Current?.Pairings;

    // The start was decided on a revision withdrawn just before Competition learned of it (D-4).
    public bool StartCrossedWithdrawal => StartedOnRevision is { } number && _publications.Exists(publication => publication.Number == number && publication.IsWithdrawn);

    public bool IsDraftStale => Draft is { } draft && draft.Pairings.EligibleRevision != Field.Revision;

    // Set while the draft is stale, or while the published revision no longer matches the field (D-5).
    public FieldChange? DraftChange => IsDraftStale ? ChangeFrom(Draft!.Pairings) : null;

    public FieldChange? CrossedChange => Current is { } current && current.Pairings.EligibleRevision != Field.Revision ? ChangeFrom(current.Pairings) : null;

    public static Schedule Track(TournamentId id, EligibleField field) => new(id, field);

    // Once only: a later start report changes nothing. Nothing is repaired here (D-4).
    public bool ApplyStart(int scheduleRevision, DateTimeOffset at, int? activePlayersPerSide = null)
    {
        if (StartedOnRevision is not null)
        {
            return false;
        }

        StartedOnRevision = scheduleRevision;
        StartedAt = at;
        ActivePlayersPerSide = activePlayersPerSide;
        Revision++;
        return true;
    }

    // One scheduled match per pairing of the started revision; rests never become matches (h1-match-lineups D-1).
    public IReadOnlyList<Match> ScheduleMatches()
    {
        if (StartedPairings is not { } pairings)
        {
            return [];
        }

        ResultsRevision++;
        return [.. pairings.Matches.Select(pairing => Match.Schedule(Id, pairing, ActivePlayersPerSide))];
    }

    // One of the schedule's matches was resolved: the results change.
    public void ResultRecorded() => ResultsRevision++;

    public Departure? DepartureOf(Guid entryId) => _departures.Find(departure => departure.EntryId == entryId);

    public EntrantStatus StatusOf(Guid entryId) => DepartureOf(entryId)?.Status ?? EntrantStatus.Active;

    // Withdraws or disqualifies an entrant of the running competition and, in the same write, resolves its unresolved matches
    // (h1-round-operations D-2). The matches are the tournament's; the results revision grows once.
    public WriteResult Depart(
        Guid operationId, Guid entryId, EntrantStatus status, string? reason, int expectedRevision, IReadOnlyList<Match> matches, Guid actor, DateTimeOffset at)
    {
        if (DepartureOf(entryId) is { } departed)
        {
            return departed.OperationId == operationId ? WriteOutcome.Repeated : WriteResult.Reject("entrant", "departed");
        }

        if (IsFinalised)
        {
            return FinalisedRefusal;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedPairings is not { } pairings)
        {
            return WriteResult.Reject("schedule", "not-started");
        }

        // The API also binds integers to the enum.
        if (status is not (EntrantStatus.Withdrawn or EntrantStatus.Disqualified))
        {
            return WriteResult.Reject("status", "unknown");
        }

        if (pairings.Entrants.All(entrant => entrant.EntryId != entryId))
        {
            return WriteResult.Reject("entrant", "unknown");
        }

        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            return WriteResult.Reject("reason", "required");
        }

        if (reason.Length > ReasonMaxLength)
        {
            return WriteResult.Reject("reason", "too-long");
        }

        _departures.Add(new(entryId, status, reason, actor, at, operationId, Revision + 1));
        foreach (var match in matches.Where(match => match.First == entryId || match.Second == entryId))
        {
            var side = match.First == entryId ? Side.First : Side.Second;
            var opponent = match.EntryOf(side == Side.First ? Side.Second : Side.First);
            match.ResolveForDeparture(operationId, side, DepartureOf(opponent)?.OperationId, actor, at);
        }

        Raise(new EntrantDeparted(Id, entryId, status, actor, at));
        Revision++;
        ResultsRevision++;
        return WriteOutcome.Applied;
    }

    // A player's withdrawal from the tournament, final; the reason is optional (A-2).
    public WriteResult WithdrawPlayer(Guid entryId, Guid playerId, string? reason, int expectedRevision, Guid actor, DateTimeOffset at) =>
        ChangePlayer(entryId, playerId, expectedRevision, (player, revision) =>
        {
            if (player.Withdrawal is not null)
            {
                return (WriteOutcome.Repeated, player);
            }

            reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
            return reason?.Length > ReasonMaxLength
                ? (WriteResult.Reject("reason", "too-long"), player)
                : (WriteOutcome.Applied, player with { Withdrawal = new(reason, actor, at, revision) });
        });

    // A sanction lasts until the owner lifts it; its reason is required (A-2).
    public WriteResult SanctionPlayer(Guid entryId, Guid playerId, string? reason, int expectedRevision, Guid actor, DateTimeOffset at) =>
        ChangePlayer(entryId, playerId, expectedRevision, (player, revision) =>
        {
            if (player.Sanctions.Any(sanction => sanction.IsActive))
            {
                return (WriteOutcome.Repeated, player);
            }

            if (player.Withdrawal is not null)
            {
                return (WriteResult.Reject("player", "withdrawn"), player);
            }

            reason = reason?.Trim();
            return string.IsNullOrEmpty(reason) ? (WriteResult.Reject("reason", "required"), player)
                : reason.Length > ReasonMaxLength ? (WriteResult.Reject("reason", "too-long"), player)
                : (WriteOutcome.Applied, player with { Sanctions = [.. player.Sanctions, new(reason, actor, at, revision)] });
        });

    public WriteResult LiftSanction(Guid entryId, Guid playerId, int expectedRevision, Guid actor, DateTimeOffset at) =>
        ChangePlayer(entryId, playerId, expectedRevision, (player, revision) =>
            player.Sanctions.Count > 0 && player.Sanctions[^1] is { IsActive: true } active
                ? (WriteOutcome.Applied, player with { Sanctions = [.. player.Sanctions.SkipLast(1), active with { LiftedBy = actor, LiftedAt = at, LiftRevision = revision }] })
                : (player.Sanctions.Count > 0 ? WriteOutcome.Repeated : WriteResult.Reject("player", "not-sanctioned"), player));

    // Applies a change to a frozen-roster player of a running competition, answering a repeat before the revision.
    private WriteResult ChangePlayer(Guid entryId, Guid playerId, int expectedRevision, Func<PlayerAvailability, int, (WriteResult Result, PlayerAvailability Player)> change)
    {
        if (StartedAt is null)
        {
            return WriteResult.Reject("schedule", "not-started");
        }

        if (RosterOf(entryId) is not { } roster || !roster.Contains(playerId))
        {
            return WriteResult.Reject("player", "not-on-roster");
        }

        var current = _players.Find(player => player.EntryId == entryId && player.PlayerId == playerId) ?? new(entryId, playerId, null, []);
        (var result, var changed) = change(current, Revision + 1);
        if (result.Outcome != WriteOutcome.Applied)
        {
            return result;
        }

        if (IsFinalised)
        {
            return FinalisedRefusal;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        _players.Remove(current);
        _players.Add(changed);
        Revision++;
        return WriteOutcome.Applied;
    }

    // Newer reports replace the rosters; older ones change nothing.
    public bool ApplyRosters(FrozenRosters rosters)
    {
        if (rosters.Revision <= (Rosters?.Revision ?? 0))
        {
            return false;
        }

        Rosters = rosters;
        Revision++;
        return true;
    }

    // The frozen roster's player identities for an entry, or null while unknown.
    public IReadOnlyCollection<Guid>? RosterOf(Guid entryId) =>
        Rosters?.Teams.SingleOrDefault(team => team.EntryId == entryId)?.Players.Select(player => player.PlayerId).ToHashSet();

    // Newer reports replace the field; older ones change nothing. Nothing else changes with it.
    public bool ApplyField(EligibleField field)
    {
        if (field.Revision <= Field.Revision)
        {
            return false;
        }

        Field = field;
        Revision++;
        return true;
    }

    // The reasons a draft cannot be generated now, in the order the owner fixes them.
    public IReadOnlyList<BrokenRule> Blockers
    {
        get
        {
            List<BrokenRule> broken = [];
            if (!Field.RegistrationClosed)
            {
                broken.Add(new("registration", "not-closed"));
            }

            if (Field.Pending.Count > 0)
            {
                broken.Add(new("entries", "pending"));
            }

            if (Field.Entrants.Count < 2)
            {
                broken.Add(new("entrants", "fewer-than-two"));
            }

            return broken;
        }
    }

    // A draw needs its seed, chosen by the caller so the domain stays deterministic (D-6).
    public WriteResult Generate(Guid operationId, Seeding seeding, int? seed, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Draft?.OperationId == operationId)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedAt is not null)
        {
            return Started;
        }

        if (Current is not null)
        {
            return WriteResult.Reject("schedule", "published");
        }

        if (Blockers is { Count: > 0 } blockers)
        {
            return new(WriteOutcome.Rejected, blockers);
        }

        if (seeding == Seeding.Draw && seed is null)
        {
            throw new ArgumentNullException(nameof(seed), "A draw needs its seed.");
        }

        var ordered = seeding == Seeding.Draw ? RoundRobin.Shuffle(Field.Entrants, seed!.Value) : Field.Entrants;
        (var matches, var rests) = RoundRobin.Pair([.. ordered.Select(entrant => entrant.EntryId)]);
        var pairings = new Pairings(seeding, seeding == Seeding.Draw ? seed : null, Field.Revision, Field.Entrants, matches, rests);
        Draft = new(operationId, pairings, actor, at);
        Raise(new DraftGenerated(Id, seeding, pairings.Seed, Field.Revision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    public WriteResult Publish(int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Current is not null && Draft is null)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (Draft is null)
        {
            return WriteResult.Reject("draft", "none");
        }

        if (IsDraftStale)
        {
            return WriteResult.Reject("draft", "stale");
        }

        var number = _publications.Count + 1;
        _publications.Add(new(number, Draft.Pairings, actor, at));
        Draft = null;
        Raise(new SchedulePublished(Id, number, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // The withdrawn revision stays in the history; its pairings come back as the draft (A-3).
    public WriteResult Withdraw(int expectedRevision, string? reason, Guid actor, DateTimeOffset at)
    {
        if (Current is not { } current)
        {
            return _publications.Count > 0 ? WriteOutcome.Repeated : WriteResult.Reject("schedule", "not-published");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedAt is not null)
        {
            return Started;
        }

        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            return WriteResult.Reject("reason", "required");
        }

        if (reason.Length > ReasonMaxLength)
        {
            return WriteResult.Reject("reason", "too-long");
        }

        _publications[_publications.IndexOf(current)] = current with { WithdrawalReason = reason, WithdrawnBy = actor, WithdrawnAt = at };
        // The draft is back by this withdrawal: its author and time are the withdrawal's.
        Draft = new(null, current.Pairings, actor, at);
        Raise(new ScheduleWithdrawn(Id, current.Number, reason, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // Every match resolved and the reviewed results revision current: the review barrier (h1-finalisation D-1).
    public WriteResult Finalise(int reviewedRevision, int expectedRevision, IReadOnlyList<Match> matches, Guid actor, DateTimeOffset at)
    {
        if (Final?.ResultsRevision == reviewedRevision)
        {
            return WriteOutcome.Repeated;
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        if (StartedAt is null || matches.Count == 0)
        {
            return WriteResult.Reject("schedule", "not-started");
        }

        if (IsFinalised)
        {
            return FinalisedRefusal;
        }

        if (matches.Where(match => match.State != MatchState.Resolved).OrderBy(match => match.Round).ToList() is { Count: > 0 } unresolved)
        {
            return new(WriteOutcome.Rejected, [.. unresolved.Select(match => new BrokenRule($"match-{match.Id.Value}", "unresolved"))]);
        }

        if (reviewedRevision != ResultsRevision)
        {
            return WriteResult.Reject("review", "stale");
        }

        var number = _finals.Count + 1;
        _finals.Add(new(number, ResultsRevision, actor, at));
        Raise(new CompetitionFinalised(Id, number, ResultsRevision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // Back to running for corrections; the final revision stays listed with the reason (h1-finalisation D-3).
    public WriteResult Reopen(string? reason, int expectedRevision, Guid actor, DateTimeOffset at)
    {
        if (Final is not { } final)
        {
            return _finals.Count > 0 ? WriteOutcome.Repeated : WriteResult.Reject("competition", "not-finalised");
        }

        if (expectedRevision != Revision)
        {
            return WriteOutcome.Stale;
        }

        reason = reason?.Trim();
        if (string.IsNullOrEmpty(reason))
        {
            return WriteResult.Reject("reason", "required");
        }

        if (reason.Length > ReasonMaxLength)
        {
            return WriteResult.Reject("reason", "too-long");
        }

        _finals[^1] = final with { ReopenReason = reason, ReopenedBy = actor, ReopenedAt = at };
        Raise(new CompetitionReopened(Id, final.Number, final.ResultsRevision, actor, at));
        Revision++;
        return WriteOutcome.Applied;
    }

    // What every competitive write answers on a finalised competition: reopen it first (h1-finalisation D-2).
    public static WriteResult FinalisedRefusal => WriteResult.Reject("competition", "finalised");

    private static WriteResult Started => WriteResult.Reject("schedule", "competition-started");

    private FieldChange ChangeFrom(Pairings pairings) => new(
        [.. Field.Entrants.Where(entrant => pairings.Entrants.All(paired => paired.EntryId != entrant.EntryId))],
        [.. pairings.Entrants.Where(paired => Field.Entrants.All(entrant => entrant.EntryId != paired.EntryId))]);
}
