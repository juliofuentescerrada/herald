using System.Text.Json;
using Herald.Contracts.Tournaments.V1;
using Shouldly;

namespace Herald.Registration.Tests.Contracts;

public class TournamentEntryTermsChangedTests
{
    [Fact]
    public void A_version_1_message_sent_before_roster_sizes_existed_still_reads()
    {
        var organisation = Guid.NewGuid();
        var tournament = Guid.NewGuid();
        var json = $$"""
            {"OrganisationId":"{{organisation}}","TournamentId":"{{tournament}}","Revision":4,"Registration":1,"Capacity":8,"EntryKind":1,"Admission":0}
            """;

        var message = JsonSerializer.Deserialize<TournamentEntryTermsChanged>(json)!;

        message.ShouldBe(new TournamentEntryTermsChanged(organisation, tournament, 4, RegistrationState.Open, 8, EntryKind.Team, Admission.Automatic));
        message.MinimumRosterSize.ShouldBeNull();
        message.MaximumRosterSize.ShouldBeNull();
    }
}
