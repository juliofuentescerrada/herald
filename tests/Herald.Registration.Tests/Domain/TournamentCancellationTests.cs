using Herald.Registration.Domain;
using Shouldly;

namespace Herald.Registration.Tests.Domain;

public class TournamentCancellationTests
{
    private static readonly DateTimeOffset _at = new(2026, 11, 16, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _owner = Guid.NewGuid();

    // Capacity 3 with automatic admission: three admitted and one waiting with "capacity full".
    private Field Full()
    {
        var field = Field.Track(new TournamentId(Guid.NewGuid()), new(RegistrationState.Open, 3, EntryKind.Individual, Admission.Automatic), termsRevision: 3, _at);
        for (var i = 0; i < 4; i++)
        {
            field.Enter(new EntryId(Guid.NewGuid()), new GuestId(Guid.NewGuid()), GuestKind.Player, _owner, _at).Outcome.ShouldBe(WriteOutcome.Applied);
        }

        field.ClearDomainEvents();
        return field;
    }

    [Fact]
    [Trait("covers", "guest-entries: Entries of a cancelled tournament")]
    public void A_cancellation_cancels_every_active_entry_with_its_cause_and_admits_nobody()
    {
        var field = Full();
        var ids = field.Entries.Select(entry => entry.Id).ToList();

        field.ApplyCancellation(_owner, _at).ShouldBeTrue();

        field.Entries.Select(entry => entry.Id).ShouldBe(ids);
        field.Entries.ShouldAllBe(entry => entry.State == EntryState.Cancelled && entry.CancellationCause == CancellationCause.TournamentCancelled);
        field.DomainEvents.OfType<EntryAdmitted>().ShouldBeEmpty();
        field.DomainEvents.OfType<EntryCancelled>().Count().ShouldBe(4);
        field.IsTournamentCancelled.ShouldBeTrue();
    }

    [Fact]
    public void A_second_delivery_changes_nothing()
    {
        var field = Full();
        field.ApplyCancellation(_owner, _at);
        var revision = field.Revision;

        field.ApplyCancellation(_owner, _at).ShouldBeFalse();

        field.Revision.ShouldBe(revision);
    }
}
