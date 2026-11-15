using System.Text.Json;
using Herald.Contracts.Competition.V1;
using Shouldly;

namespace Herald.Standings.Tests.Contracts;

public class TournamentResultsChangedTests
{
    [Fact]
    public void A_version_1_message_reads_back_as_sent()
    {
        var organisation = Guid.NewGuid();
        var tournament = Guid.NewGuid();
        var (first, second, rested, resolved, pending) = (Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var json = $$"""
            {"OrganisationId":"{{organisation}}","TournamentId":"{{tournament}}","Revision":3,
             "Entrants":[{"EntryId":"{{first}}","Name":"Robin Vale"},{"EntryId":"{{second}}","Name":"Sam Reed"},{"EntryId":"{{rested}}","Name":"Taylor Finch"}],
             "Matches":[{"MatchId":"{{resolved}}","Round":1,"First":"{{first}}","Second":"{{second}}","State":2,"Outcome":3,"Cause":"played","Played":true},
                        {"MatchId":"{{pending}}","Round":2,"First":"{{second}}","Second":"{{rested}}","State":0,"Outcome":null,"Cause":null,"Played":null}],
             "Rests":[{"Round":1,"EntryId":"{{rested}}"}]}
            """;

        var message = JsonSerializer.Deserialize<TournamentResultsChanged>(json)!;

        (message.OrganisationId, message.TournamentId, message.Revision).ShouldBe((organisation, tournament, 3));
        message.Entrants.ShouldBe([new(first, "Robin Vale"), new(second, "Sam Reed"), new(rested, "Taylor Finch")]);
        message.Matches.ShouldBe([
            new(resolved, 1, first, second, ResultsMatchState.Resolved, ResultOutcome.None, "played", true),
            new(pending, 2, second, rested, ResultsMatchState.Scheduled, null, null, null)]);
        message.Rests.ShouldBe([new(1, rested)]);

        var again = JsonSerializer.Deserialize<TournamentResultsChanged>(JsonSerializer.Serialize(message))!;
        again.Matches.ShouldBe(message.Matches);
        again.Rests.ShouldBe(message.Rests);
    }
}
