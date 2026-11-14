using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Shouldly;

namespace Herald.Tournaments.Tests.Contracts;

public class TermsRevisionTests
{
    [Fact]
    public void Two_writers_of_the_entry_terms_cannot_both_save_the_same_terms_revision()
    {
        using var db = new TournamentsDesignTimeFactory().CreateDbContext([]);

        var tournament = db.Model.FindEntityType(typeof(Tournament))!;

        tournament.FindProperty(nameof(Tournament.TermsRevision))!.IsConcurrencyToken.ShouldBeTrue();
        tournament.FindProperty(nameof(Tournament.Revision))!.IsConcurrencyToken.ShouldBeTrue();
    }
}
