using System.Text.Json;
using Herald.Contracts.Registration.V1;
using Shouldly;

namespace Herald.Registration.Tests.Contracts;

public class TournamentEligibleFieldChangedTests
{
    [Fact]
    public void A_message_survives_a_round_trip_with_its_entrants()
    {
        var message = new TournamentEligibleFieldChanged(
            Guid.NewGuid(), Guid.NewGuid(), 3, RegistrationClosed: true, Pending: 1, [new(Guid.NewGuid(), "Ana Ruiz", 1), new(Guid.NewGuid(), "Leo Martín", 2)]);

        var read = JsonSerializer.Deserialize<TournamentEligibleFieldChanged>(JsonSerializer.Serialize(message))!;

        read.Revision.ShouldBe(3);
        read.RegistrationClosed.ShouldBeTrue();
        read.Pending.ShouldBe(1);
        read.Entrants.ShouldBe(message.Entrants);
    }
}
