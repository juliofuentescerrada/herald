using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class CompetitionStartTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 21, 10, 5, 0, TimeSpan.Zero);
    private static readonly EntryTerms _teams = new(RegistrationState.Open, 4, EntryKind.Team, Admission.Automatic, MinimumRosterSize: 3, MaximumRosterSize: 5, CheckIn: CheckInPolicy.Mandatory);
    private readonly Guid _owner = Guid.NewGuid();

    private static Entry EnterTeam(Field field)
    {
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), GuestKind.Team, Guid.NewGuid(), _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return field.Find(id)!;
    }

    private WriteResult Add(Field field, Entry team) =>
        field.AddRosterMember(team.Id, new GuestId(Guid.NewGuid()), GuestKind.Player, team.RosterRevision, _owner, _at);

    private static void Change(Field field, EntryTerms terms) => field.ApplyTerms(terms, field.TermsRevision + 1, _at).ShouldBeTrue();

    // Two teams of three, checked in; registration closed and the schedule published, then started.
    private (Field Field, Entry First, Entry Second) Started()
    {
        var field = Field.Track(new TournamentId(Guid.NewGuid()), _teams, 3, _at);
        var first = EnterTeam(field);
        var second = EnterTeam(field);
        foreach (var team in new[] { first, second })
        {
            for (var i = 0; i < 3; i++)
            {
                Add(field, team).Outcome.ShouldBe(WriteOutcome.Applied);
            }

            field.SetCheckIn(team.Id, checkedIn: true, team.CheckInRevision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        }

        Change(field, _teams with { Registration = RegistrationState.Closed, FieldLocked = true });
        Change(field, _teams with { Registration = RegistrationState.Closed, FieldLocked = true, CompetitionStarted = true });
        return (field, first, second);
    }

    [Fact]
    public void Start_freezes_each_admitted_team_on_its_current_roster_revision()
    {
        var (_, first, _) = Started();

        first.FrozenRosterRevision.ShouldBe(3);
        first.RosterFrozenAt.ShouldBe(_at);
    }

    [Fact]
    [Trait("covers", "team-rosters: Adding after start")]
    public void Adding_a_member_after_start_is_rejected_as_frozen()
    {
        var (field, first, _) = Started();

        Add(field, first).Broken.ShouldBe([new BrokenRule("roster", "frozen")]);
        first.Members.Count.ShouldBe(3);
    }

    [Fact]
    public void Removing_a_member_after_start_is_rejected_as_frozen()
    {
        var (field, first, _) = Started();

        field.RemoveRosterMember(first.Id, first.Members[0].GuestId, first.RosterRevision, _owner, _at).Broken.ShouldBe([new BrokenRule("roster", "frozen")]);
    }

    [Fact]
    [Trait("covers", "competition-start: Cancelling after start")]
    public void Cancelling_after_start_is_rejected_stating_the_competition_started()
    {
        var (field, first, _) = Started();

        field.Cancel(first.Id, first.Revision, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "competition-started")]);
        first.State.ShouldBe(EntryState.Admitted);
    }

    [Fact]
    public void Undoing_a_check_in_after_start_is_rejected_stating_the_competition_started()
    {
        var (field, first, _) = Started();

        field.SetCheckIn(first.Id, checkedIn: false, first.CheckInRevision, _owner, _at).Broken.ShouldBe([new BrokenRule("field", "competition-started")]);
    }

    [Fact]
    public void A_roster_below_its_minimum_is_outside_its_bounds()
    {
        var field = Field.Track(new TournamentId(Guid.NewGuid()), _teams, 3, _at);
        var incomplete = EnterTeam(field);
        Add(field, incomplete);

        field.RostersOutsideBounds.ShouldBe([incomplete]);
    }
}
