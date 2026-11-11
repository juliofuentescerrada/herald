using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class RosterTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 11, 18, 20, 0, TimeSpan.Zero);
    private static readonly EntryTerms _teams = new(RegistrationState.Open, 4, EntryKind.Team, Admission.Automatic, MinimumRosterSize: 3, MaximumRosterSize: 5);
    private readonly TournamentId _tournament = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();

    private Field Track(EntryTerms? terms = null) => Field.Track(_tournament, terms ?? _teams, termsRevision: 3, _at);

    private static Entry EnterTeam(Field field)
    {
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), GuestKind.Team, Guid.NewGuid(), _at).Outcome.ShouldBe(WriteOutcome.Applied);
        return field.Find(id)!;
    }

    private WriteResult Add(Field field, Entry entry, GuestId player, GuestKind kind = GuestKind.Player) =>
        field.AddRosterMember(entry.Id, player, kind, entry.RosterRevision, _owner, _at);

    // Adds new players and returns them.
    private List<GuestId> AddPlayers(Field field, Entry entry, int count)
    {
        var players = Enumerable.Range(0, count).Select(_ => new GuestId(Guid.NewGuid())).ToList();
        players.ForEach(player => Add(field, entry, player).Outcome.ShouldBe(WriteOutcome.Applied));
        return players;
    }

    private static void Change(Field field, EntryTerms terms) => field.ApplyTerms(terms, field.TermsRevision + 1, _at).ShouldBeTrue();

    [Fact]
    public void An_owner_adds_a_player_to_a_waiting_team()
    {
        var field = Track(_teams with { Admission = Admission.Manual });
        var team = EnterTeam(field);
        var player = new GuestId(Guid.NewGuid());
        var revision = field.Revision;
        field.ClearDomainEvents();

        Add(field, team, player).Outcome.ShouldBe(WriteOutcome.Applied);

        team.State.ShouldBe(EntryState.Waiting);
        team.Members.ShouldBe([new RosterMember(player, _owner, _at)]);
        team.RosterRevision.ShouldBe(1);
        team.Revision.ShouldBe(1);
        field.Revision.ShouldBe(revision + 1);
        field.DomainEvents.ShouldBe([new RosterMemberAdded(_tournament, team.Id, player, 1, _owner, _at)]);
    }

    [Fact]
    public void A_guest_team_cannot_be_a_member()
    {
        var field = Track();
        var team = EnterTeam(field);

        Add(field, team, new GuestId(Guid.NewGuid()), GuestKind.Team).Broken.ShouldBe([new BrokenRule("guestId", "not-a-player")]);

        team.Members.ShouldBeEmpty();
    }

    [Fact]
    public void A_cancelled_teams_roster_is_fixed()
    {
        var field = Track();
        var team = EnterTeam(field);
        field.Cancel(team.Id, team.Revision, _owner, _at);

        Add(field, team, new GuestId(Guid.NewGuid())).Broken.ShouldBe([new BrokenRule("entry", "cancelled")]);

        team.Members.ShouldBeEmpty();
        team.RosterRevision.ShouldBe(0);
    }

    [Fact]
    public void Rosters_change_after_registration_closes()
    {
        var field = Track();
        var team = EnterTeam(field);
        var player = AddPlayers(field, team, 1)[0];
        Change(field, field.Terms with { Registration = RegistrationState.Closed });

        field.RemoveRosterMember(team.Id, player, team.RosterRevision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        team.Members.ShouldBeEmpty();
    }

    [Fact]
    public void Individual_entries_have_no_roster()
    {
        var field = Track(new(RegistrationState.Open, 4, EntryKind.Individual, Admission.Automatic));
        var id = new EntryId(Guid.NewGuid());
        field.Enter(id, new GuestId(Guid.NewGuid()), GuestKind.Player, _owner, _at);
        var entry = field.Find(id)!;

        Add(field, entry, new GuestId(Guid.NewGuid())).Broken.ShouldBe([new BrokenRule("entry", "not-team-tournament")]);

        entry.Members.ShouldBeEmpty();
        field.ReadinessOf(entry).ShouldBeNull();
    }

    [Fact]
    public void A_full_roster_rejects_another_player()
    {
        var field = Track();
        var team = EnterTeam(field);
        AddPlayers(field, team, 5);

        Add(field, team, new GuestId(Guid.NewGuid())).Broken.ShouldBe([new BrokenRule("roster", "full")]);

        team.Members.Count.ShouldBe(5);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Complete);
    }

    [Fact]
    public void A_roster_below_the_minimum_is_allowed_and_incomplete()
    {
        var field = Track();
        var team = EnterTeam(field);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Incomplete);

        AddPlayers(field, team, 2);

        team.Members.Count.ShouldBe(2);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Incomplete);
        AddPlayers(field, team, 1);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Complete);
    }

    [Fact]
    public void A_lowered_maximum_keeps_every_member_and_blocks_adding_until_one_is_removed()
    {
        var field = Track();
        var team = EnterTeam(field);
        var players = AddPlayers(field, team, 5);

        Change(field, field.Terms with { MaximumRosterSize = 4 });

        team.Members.Select(member => member.GuestId).ShouldBe(players);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.AboveMaximum);
        Add(field, team, new GuestId(Guid.NewGuid())).Broken.ShouldBe([new BrokenRule("roster", "full")]);
        field.RemoveRosterMember(team.Id, players[0], team.RosterRevision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        field.ReadinessOf(team).ShouldBe(RosterReadiness.Complete);
    }

    [Fact]
    public void A_player_on_another_active_team_is_rejected()
    {
        var field = Track();
        var teamA = EnterTeam(field);
        var teamB = EnterTeam(field);
        var ana = AddPlayers(field, teamA, 1)[0];

        Add(field, teamB, ana).Broken.ShouldBe([new BrokenRule("guestId", "on-another-team")]);

        field.TeamOf(ana, teamB.Id).ShouldBe(teamA);
        teamA.Members.Count.ShouldBe(1);
        teamB.Members.ShouldBeEmpty();
    }

    [Fact]
    public void A_cancelled_team_releases_its_players_and_keeps_them_as_evidence()
    {
        var field = Track();
        var teamA = EnterTeam(field);
        var teamB = EnterTeam(field);
        var ana = AddPlayers(field, teamA, 1)[0];
        field.Cancel(teamA.Id, teamA.Revision, _owner, _at);

        Add(field, teamB, ana).Outcome.ShouldBe(WriteOutcome.Applied);

        teamB.HasMember(ana).ShouldBeTrue();
        teamA.HasMember(ana).ShouldBeTrue();
        teamA.RosterRevision.ShouldBe(1);
    }

    [Fact]
    public void Repeats_return_the_current_roster_whatever_revision_they_state()
    {
        var field = Track();
        var team = EnterTeam(field);
        var player = AddPlayers(field, team, 1)[0];

        field.AddRosterMember(team.Id, player, GuestKind.Player, 0, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        field.RemoveRosterMember(team.Id, new GuestId(Guid.NewGuid()), 0, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);

        team.RosterRevision.ShouldBe(1);
    }

    [Fact]
    public void A_write_based_on_an_older_roster_revision_is_stale()
    {
        var field = Track();
        var team = EnterTeam(field);
        var players = AddPlayers(field, team, 2);
        field.RemoveRosterMember(team.Id, players[0], 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        field.AddRosterMember(team.Id, new GuestId(Guid.NewGuid()), GuestKind.Player, 2, _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);

        team.Members.Count.ShouldBe(1);
    }

    [Fact]
    public void A_removal_is_kept_in_the_history()
    {
        var field = Track();
        var team = EnterTeam(field);
        var ana = AddPlayers(field, team, 1)[0];
        var later = _at.AddMinutes(5);

        field.RemoveRosterMember(team.Id, ana, 1, _owner, later).Outcome.ShouldBe(WriteOutcome.Applied);

        team.Members.ShouldBeEmpty();
        team.RosterRevision.ShouldBe(2);
        team.RosterChanges.ShouldBe([
            new RosterChange(1, ana, RosterChangeKind.Added, _owner, _at),
            new RosterChange(2, ana, RosterChangeKind.Removed, _owner, later),
        ]);
        field.DomainEvents.ShouldContain(new RosterMemberRemoved(_tournament, team.Id, ana, 2, _owner, later));
    }

    [Fact]
    public void Roster_writes_wait_for_terms_with_roster_sizes()
    {
        var field = Track(_teams with { MinimumRosterSize = null, MaximumRosterSize = null });
        var team = EnterTeam(field);

        Add(field, team, new GuestId(Guid.NewGuid())).Broken.ShouldBe([new BrokenRule("roster", "awaiting-terms")]);

        field.ReadinessOf(team).ShouldBe(RosterReadiness.AwaitingTerms);
        Change(field, _teams);
        Add(field, team, new GuestId(Guid.NewGuid())).Outcome.ShouldBe(WriteOutcome.Applied);
    }

    [Fact]
    public void Cancelling_a_team_does_not_change_its_roster_revision()
    {
        var field = Track();
        var team = EnterTeam(field);
        AddPlayers(field, team, 2);

        field.Cancel(team.Id, team.Revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);

        team.RosterRevision.ShouldBe(2);
        team.Revision.ShouldBe(2);
    }
}
