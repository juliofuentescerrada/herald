using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class DepartureTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);
    private static readonly string[] _names = ["Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch"];
    private readonly Guid _owner = Guid.NewGuid();
    private readonly Schedule _schedule;
    private readonly IReadOnlyList<Match> _matches;

    public DepartureTests()
    {
        var entrants = _names.Select((name, index) => new Entrant(Guid.NewGuid(), name, index + 1)).ToList();
        _schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], entrants));
        _schedule.Generate(Guid.NewGuid(), Seeding.AdmissionOrder, null, _schedule.Revision, _owner, _at);
        _schedule.Publish(_schedule.Revision, _owner, _at);
        _schedule.ApplyStart(1, _at, null);
        _matches = _schedule.ScheduleMatches();
    }

    private Guid Id(string name) => _schedule.Field.Entrants.Single(entrant => entrant.Name == name).EntryId;

    private Match Between(string first, string second) =>
        _matches.Single(match => new[] { match.First, match.Second }.Order().SequenceEqual(new[] { Id(first), Id(second) }.Order()));

    private Side SideOf(Match match, string name) => match.First == Id(name) ? Side.First : Side.Second;

    private WriteResult Depart(string name, EntrantStatus status = EntrantStatus.Withdrawn, string? reason = "Moved away", Guid? operation = null) =>
        _schedule.Depart(operation ?? Guid.NewGuid(), Id(name), status, reason, _schedule.Revision, _matches, _owner, _at);

    private IEnumerable<Match> MatchesOf(string name) => _matches.Where(match => match.First == Id(name) || match.Second == Id(name));

    private static Outcome WinnerIs(Side side) => side == Side.First ? Outcome.First : Outcome.Second;

    private static Side Other(Side side) => side == Side.First ? Side.Second : Side.First;

    [Fact]
    [Trait("covers", "round-operations: A withdrawal with matches left")]
    public void A_withdrawal_keeps_the_played_result_and_resolves_each_scheduled_match_as_the_entrants_absence()
    {
        var played = MatchesOf("Sam Reed").Single(match => match.Round == 1);
        played.RecordPlayed(Guid.NewGuid(), Outcome.First, played.Revision, _owner, _at);
        var result = played.Resolution;
        var resultsRevision = _schedule.ResultsRevision;

        Depart("Sam Reed").Outcome.ShouldBe(WriteOutcome.Applied);

        played.Resolution.ShouldBe(result);
        var left = MatchesOf("Sam Reed").Where(match => match.Round > 1).ToList();
        left.Count.ShouldBe(2);
        left.ShouldAllBe(match => match.Resolution!.Cause == Cause.SingleAbsence && !match.Resolution.Played);
        left.ShouldAllBe(match => match.Resolution!.Outcome == WinnerIs(Other(SideOf(match, "Sam Reed"))));
        _schedule.StatusOf(Id("Sam Reed")).ShouldBe(EntrantStatus.Withdrawn);
        _schedule.ResultsRevision.ShouldBe(resultsRevision + 1);
    }

    [Fact]
    [Trait("covers", "round-operations: A disqualification")]
    public void A_disqualification_keeps_previous_results_resolves_the_rest_as_absences_and_keeps_the_reason()
    {
        var played = MatchesOf("Robin Vale").Single(match => match.Round == 1);
        played.RecordPlayed(Guid.NewGuid(), Outcome.Draw, played.Revision, _owner, _at);

        Depart("Robin Vale", EntrantStatus.Disqualified, "Fielded an ineligible player").Outcome.ShouldBe(WriteOutcome.Applied);

        played.Resolution!.Cause.ShouldBe(Cause.Played);
        MatchesOf("Robin Vale").Where(match => match.Round > 1).ShouldAllBe(match => match.Resolution!.Cause == Cause.SingleAbsence);
        _schedule.DepartureOf(Id("Robin Vale")).ShouldBe(new Departure(Id("Robin Vale"), EntrantStatus.Disqualified, "Fielded an ineligible player", _owner, _at, _schedule.Departures[0].OperationId));
    }

    [Fact]
    [Trait("covers", "round-operations: Withdrawal in play")]
    public void A_withdrawal_in_play_resolves_that_match_as_a_concession_after_play_with_the_locked_appearances()
    {
        List<Guid> falcons = [.. Enumerable.Range(0, 5).Select(_ => Guid.NewGuid())];
        List<Guid> stars = [.. Enumerable.Range(0, 5).Select(_ => Guid.NewGuid())];
        var match = Match.Schedule(_schedule.Id, new Pairing(1, Guid.NewGuid(), Guid.NewGuid()), 5);
        match.RecordLineup(Side.First, falcons, falcons, match.Revision, _owner, _at);
        match.RecordLineup(Side.Second, stars, stars, match.Revision, _owner, _at);
        match.StartMatch(falcons, stars, match.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        match.ResolveForDeparture(Guid.NewGuid(), Side.First, null, _owner, _at).ShouldBeTrue();

        (match.Resolution!.Cause, match.Resolution.Outcome, match.Resolution.Played).ShouldBe((Cause.Concession, Outcome.Second, true));
        match.Resolution.Appearances.ShouldBe([.. falcons, .. stars]);
    }

    [Fact]
    [Trait("covers", "round-operations: No reason")]
    public void A_withdrawal_without_a_reason_is_rejected_and_the_entrant_stays_active()
    {
        Depart("Sam Reed", reason: "  ").Broken.ShouldBe([new BrokenRule("reason", "required")]);

        _schedule.StatusOf(Id("Sam Reed")).ShouldBe(EntrantStatus.Active);
        _matches.ShouldAllBe(match => match.State == MatchState.Scheduled);
    }

    [Fact]
    public void A_reason_over_500_characters_is_rejected()
    {
        Depart("Sam Reed", reason: new string('x', 501)).Broken.ShouldBe([new BrokenRule("reason", "too-long")]);
    }

    [Fact]
    public void A_repeated_departure_changes_nothing_and_a_second_one_is_rejected()
    {
        var operation = Guid.NewGuid();
        Depart("Sam Reed", operation: operation);
        var revision = _schedule.Revision;

        Depart("Sam Reed", operation: operation).Outcome.ShouldBe(WriteOutcome.Repeated);
        Depart("Sam Reed", EntrantStatus.Disqualified).Broken.ShouldBe([new BrokenRule("entrant", "departed")]);
        _schedule.Revision.ShouldBe(revision);
    }

    [Fact]
    public void A_departure_on_an_older_revision_is_stale()
    {
        _schedule.Depart(Guid.NewGuid(), Id("Sam Reed"), EntrantStatus.Withdrawn, "Ill", _schedule.Revision - 1, _matches, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
    }

    [Fact]
    public void A_departure_before_start_is_rejected()
    {
        var schedule = Schedule.Track(new TournamentId(Guid.NewGuid()), new EligibleField(1, true, [], [new(Guid.NewGuid(), "A", 1), new(Guid.NewGuid(), "B", 2)]));

        schedule.Depart(Guid.NewGuid(), schedule.Field.Entrants[0].EntryId, EntrantStatus.Withdrawn, "Ill", schedule.Revision, [], _owner, _at)
            .Broken.ShouldBe([new BrokenRule("schedule", "not-started")]);
    }

    [Fact]
    [Trait("covers", "round-operations: A then B")]
    public void When_the_second_entrant_departs_the_first_departures_absence_becomes_a_double_absence_keeping_its_predecessor()
    {
        var match = Between("Sam Reed", "Jamie Brook");
        Depart("Sam Reed");
        var first = match.Resolution!;
        first.Cause.ShouldBe(Cause.SingleAbsence);

        Depart("Jamie Brook");

        (match.Resolution!.Cause, match.Resolution.Outcome, match.Resolution.Played).ShouldBe((Cause.DoubleAbsence, Outcome.None, false));
        match.Resolution.Predecessor.ShouldBe(first);
    }

    [Fact]
    [Trait("covers", "round-operations: B then A")]
    public void Either_order_ends_the_match_as_the_same_double_absence()
    {
        var match = Between("Sam Reed", "Jamie Brook");
        Depart("Jamie Brook");
        Depart("Sam Reed");

        (match.Resolution!.Cause, match.Resolution.Outcome).ShouldBe((Cause.DoubleAbsence, Outcome.None));
    }

    [Fact]
    [Trait("covers", "round-operations: A played match")]
    public void A_played_result_is_never_revised_when_both_entrants_withdraw()
    {
        var match = Between("Sam Reed", "Jamie Brook");
        match.StartMatch(null, null, match.Revision, _owner, _at);
        match.RecordPlayed(Guid.NewGuid(), Outcome.Second, match.Revision, _owner, _at);
        var result = match.Resolution;

        Depart("Sam Reed");
        Depart("Jamie Brook");

        match.Resolution.ShouldBe(result);
    }

    [Fact]
    public void A_single_absence_the_owner_recorded_is_not_revised_by_a_departure()
    {
        var match = Between("Sam Reed", "Jamie Brook");
        match.RecordAdministrative(Guid.NewGuid(), Cause.SingleAbsence, SideOf(match, "Sam Reed"), null, null, match.Revision, _owner, _at);
        var result = match.Resolution;

        Depart("Jamie Brook");

        match.Resolution.ShouldBe(result);
    }

    [Fact]
    [Trait("covers", "round-operations: No active entrant")]
    public void When_all_four_withdraw_every_match_is_resolved_played_results_stay_and_the_competition_still_runs()
    {
        var played = Between("Robin Vale", "Sam Reed");
        played.RecordPlayed(Guid.NewGuid(), Outcome.First, played.Revision, _owner, _at);

        foreach (var name in _names)
        {
            Depart(name).Outcome.ShouldBe(WriteOutcome.Applied);
        }

        _matches.ShouldAllBe(match => match.State == MatchState.Resolved);
        played.Resolution!.Cause.ShouldBe(Cause.Played);
        _matches.Where(match => match != played).ShouldAllBe(match => match.Resolution!.Cause == Cause.DoubleAbsence);
        _schedule.StartedAt.ShouldNotBeNull();
    }
}
