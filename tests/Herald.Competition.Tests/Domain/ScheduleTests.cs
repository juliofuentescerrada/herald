using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class ScheduleTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 21, 9, 50, 0, TimeSpan.Zero);
    private readonly TournamentId _tournament = new(Guid.NewGuid());
    private readonly Guid _owner = Guid.NewGuid();

    private static List<Entrant> Entrants(params string[] names) =>
        [.. names.Select((name, index) => new Entrant(Guid.NewGuid(), name, index + 1))];

    private static readonly List<Entrant> _four = Entrants("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch");

    private Schedule Track(IReadOnlyList<Entrant>? entrants = null, bool closed = true, IReadOnlyList<PendingEntrant>? pending = null) =>
        Schedule.Track(_tournament, new EligibleField(1, closed, pending ?? [], entrants ?? _four));

    private WriteResult Generate(Schedule schedule, Seeding seeding = Seeding.AdmissionOrder, int? seed = null, Guid? operation = null) =>
        schedule.Generate(operation ?? Guid.NewGuid(), seeding, seed, schedule.Revision, _owner, _at);

    private WriteResult Publish(Schedule schedule) => schedule.Publish(schedule.Revision, _owner, _at);

    [Fact]
    [Trait("covers", "round-robin-pairings: Four individual entrants")]
    public void Four_entrants_seeded_by_admission_order_give_three_rounds_and_six_matches()
    {
        var schedule = Track();

        Generate(schedule).Outcome.ShouldBe(WriteOutcome.Applied);

        var pairings = schedule.Draft!.Pairings;
        pairings.Matches.Count.ShouldBe(6);
        pairings.Matches.Select(match => match.Round).Distinct().Count().ShouldBe(3);
        pairings.Rests.ShouldBeEmpty();
        pairings.Matches.Take(2).ShouldBe([new Pairing(1, _four[0].EntryId, _four[3].EntryId), new Pairing(1, _four[1].EntryId, _four[2].EntryId)]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Five entrants rest once each")]
    public void Five_entrants_give_five_rounds_ten_matches_and_one_rest_each()
    {
        var five = Entrants("Robin Vale", "Sam Reed", "Jamie Brook", "Taylor Finch", "Rowan Lake");
        var schedule = Track(five);

        Generate(schedule);

        var pairings = schedule.Draft!.Pairings;
        pairings.Matches.Count.ShouldBe(10);
        pairings.Rests.Select(rest => rest.EntryId).Order().ShouldBe(five.Select(entrant => entrant.EntryId).Order());
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Four teams")]
    public void Four_teams_give_six_matches_one_per_pair_of_teams()
    {
        var teams = Entrants("River Falcons", "Harbour Lights", "Meadow Foxes", "North Stars");
        var schedule = Track(teams);

        Generate(schedule);

        schedule.Draft!.Pairings.Matches.Count.ShouldBe(6);
        schedule.Draft.Pairings.Matches.ShouldAllBe(match => teams.Any(team => team.EntryId == match.First) && teams.Any(team => team.EntryId == match.Second));
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A draw is reproducible")]
    public void A_draw_records_its_seed_and_the_same_seed_gives_the_same_rounds()
    {
        var first = Track();
        var second = Track();

        Generate(first, Seeding.Draw, seed: 48213);
        Generate(second, Seeding.Draw, seed: 48213);

        first.Draft!.Pairings.Seed.ShouldBe(48213);
        first.Draft.Pairings.Matches.ShouldBe(second.Draft!.Pairings.Matches);
        first.DomainEvents.ShouldContain(new DraftGenerated(_tournament, Seeding.Draw, 48213, 1, _owner, _at));
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Registration is still open")]
    public void Generating_while_registration_is_open_is_rejected()
    {
        var schedule = Track(closed: false);

        Generate(schedule).Broken.ShouldBe([new BrokenRule("registration", "not-closed")]);
        schedule.Draft.ShouldBeNull();
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Entries are pending")]
    public void Generating_with_pending_entries_is_rejected_naming_them()
    {
        PendingEntrant[] pending = [new(Guid.NewGuid(), "Sam Reed"), new(Guid.NewGuid(), "Rowan Lake")];
        var schedule = Track(pending: pending);

        Generate(schedule).Broken.ShouldBe([new BrokenRule("entries", "pending")]);
        schedule.Field.Pending.ShouldBe(pending);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Fewer than two eligible entrants")]
    public void Generating_with_one_eligible_entrant_is_rejected()
    {
        var schedule = Track(Entrants("Robin Vale"));

        Generate(schedule).Broken.ShouldBe([new BrokenRule("entrants", "fewer-than-two")]);
    }

    [Fact]
    public void A_repeated_generation_returns_the_same_draft()
    {
        var schedule = Track();
        var operation = Guid.NewGuid();
        Generate(schedule, operation: operation);
        var draft = schedule.Draft;

        schedule.Generate(operation, Seeding.AdmissionOrder, null, expectedRevision: 1, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        schedule.Draft.ShouldBeSameAs(draft);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: An absence makes the draft stale")]
    public void A_field_change_makes_the_draft_stale_naming_the_entrant_and_blocks_publishing()
    {
        var schedule = Track();
        Generate(schedule);

        schedule.ApplyField(new EligibleField(2, true, [], [.. _four.Where(entrant => entrant.Name != "Sam Reed")])).ShouldBeTrue();

        schedule.IsDraftStale.ShouldBeTrue();
        schedule.DraftChange!.Removed.Select(entrant => entrant.Name).ShouldBe(["Sam Reed"]);
        Publish(schedule).Broken.ShouldBe([new BrokenRule("draft", "stale")]);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Regenerating replaces the draft")]
    public void Regenerating_follows_the_current_field()
    {
        var schedule = Track();
        Generate(schedule);
        var three = _four.Take(3).ToList();
        schedule.ApplyField(new EligibleField(2, true, [], three));

        Generate(schedule).Outcome.ShouldBe(WriteOutcome.Applied);

        schedule.IsDraftStale.ShouldBeFalse();
        schedule.Draft!.Pairings.Entrants.ShouldBe(three);
        schedule.Draft.Pairings.Matches.Count.ShouldBe(3);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: An older report changes nothing")]
    public void An_older_field_changes_nothing()
    {
        var schedule = Track();
        schedule.ApplyField(new EligibleField(3, true, [], _four));

        schedule.ApplyField(new EligibleField(2, true, [], [])).ShouldBeFalse();

        schedule.Field.Revision.ShouldBe(3);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: The owner publishes")]
    public void Publishing_creates_revision_one_with_who_and_when()
    {
        var schedule = Track();
        Generate(schedule);

        Publish(schedule).Outcome.ShouldBe(WriteOutcome.Applied);

        var current = schedule.Current!;
        current.Number.ShouldBe(1);
        current.Pairings.Matches.Count.ShouldBe(6);
        (current.PublishedBy, current.PublishedAt).ShouldBe((_owner, _at));
        schedule.Draft.ShouldBeNull();
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Publishing twice")]
    public void Publishing_twice_returns_the_same_revision()
    {
        var schedule = Track();
        Generate(schedule);
        var revision = schedule.Revision;
        Publish(schedule);

        schedule.Publish(revision, _owner, _at).Outcome.ShouldBe(WriteOutcome.Repeated);
        schedule.Publications.Count.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Withdraw and republish")]
    public void Withdrawing_keeps_the_revision_and_republishing_creates_the_next()
    {
        var schedule = Track();
        Generate(schedule);
        Publish(schedule);

        schedule.Withdraw(schedule.Revision, "Late absence", _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        schedule.ApplyField(new EligibleField(2, true, [], [.. _four.Take(3)]));
        Generate(schedule);
        Publish(schedule);

        schedule.Current!.Number.ShouldBe(2);
        schedule.Publications[0].ShouldSatisfyAllConditions(
            first => first.IsWithdrawn.ShouldBeTrue(),
            first => first.WithdrawalReason.ShouldBe("Late absence"));
    }

    [Fact]
    public void Withdrawing_returns_the_pairings_as_the_draft()
    {
        var schedule = Track();
        Generate(schedule);
        var pairings = schedule.Draft!.Pairings;
        Publish(schedule);

        schedule.Withdraw(schedule.Revision, "Late absence", _owner, _at);

        schedule.Current.ShouldBeNull();
        schedule.Draft!.Pairings.ShouldBe(pairings);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A reason is required")]
    public void Withdrawing_without_a_reason_is_rejected()
    {
        var schedule = Track();
        Generate(schedule);
        Publish(schedule);

        schedule.Withdraw(schedule.Revision, "  ", _owner, _at).Broken.ShouldBe([new BrokenRule("reason", "required")]);
        schedule.Current!.Number.ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: A cancellation crossed the publication")]
    public void A_field_change_after_publication_is_reported_and_the_pairings_are_kept()
    {
        var schedule = Track();
        Generate(schedule);
        Publish(schedule);
        var matches = schedule.Current!.Pairings.Matches;

        schedule.ApplyField(new EligibleField(2, true, [], [.. _four.Where(entrant => entrant.Name != "Sam Reed")]));

        schedule.CrossedChange!.Removed.Select(entrant => entrant.Name).ShouldBe(["Sam Reed"]);
        schedule.Current.Pairings.Matches.ShouldBe(matches);
    }

    [Fact]
    [Trait("covers", "round-robin-pairings: Another tab published first")]
    public void A_write_based_on_an_older_revision_is_stale()
    {
        var schedule = Track();
        Generate(schedule);
        var seen = schedule.Revision;
        Publish(schedule);

        schedule.Withdraw(seen, "Late absence", _owner, _at).Outcome.ShouldBe(WriteOutcome.Stale);
        schedule.Current.ShouldNotBeNull();
    }

    [Fact]
    public void Generating_while_a_revision_is_published_is_rejected()
    {
        var schedule = Track();
        Generate(schedule);
        Publish(schedule);

        Generate(schedule).Broken.ShouldBe([new BrokenRule("schedule", "published")]);
    }
}
