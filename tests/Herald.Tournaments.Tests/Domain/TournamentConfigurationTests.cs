using Herald.Tournaments.Domain;
using Shouldly;

namespace Herald.Tournaments.Tests.Domain;

public class TournamentConfigurationTests
{
    internal static readonly TournamentConfiguration CompleteIndividual = new(
        "Saturday Open",
        GameVariant: "Example strategy · Standard variant",
        EntryKind: EntryKind.Individual,
        Capacity: 8,
        RegistrationOpensAt: new DateTime(2026, 11, 10, 9, 0, 0),
        RegistrationClosesAt: new DateTime(2026, 11, 13, 18, 0, 0),
        PlannedStartAt: new DateTime(2026, 11, 14, 10, 0, 0),
        TimeZone: "Europe/Madrid",
        Location: LocationMode.OnSite,
        Venue: "Madrid",
        Admission: Admission.Manual,
        CheckIn: CheckIn.Mandatory,
        Visibility: Visibility.Private);

    internal static readonly TournamentConfiguration CompleteTeam = CompleteIndividual with
    {
        Title = "Saturday Team League",
        EntryKind = EntryKind.Team,
        Capacity = 16,
        MinimumRosterSize = 5,
        MaximumRosterSize = 7,
        ActivePlayersPerSide = 5,
    };

    private static void ShouldBreak(TournamentConfiguration configuration, string field, string rule) =>
        configuration.Normalised().Check().ShouldBe([new BrokenRule(field, rule)]);

    [Fact]
    public void A_title_alone_is_a_valid_draft() => new TournamentConfiguration(" Saturday Open ").Normalised().Check().ShouldBeEmpty();

    [Fact]
    public void Complete_individual_and_team_configurations_break_no_rule()
    {
        CompleteIndividual.Check().ShouldBeEmpty();
        CompleteTeam.Check().ShouldBeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public void A_blank_title_is_required(string? title) => ShouldBreak(new(title!), "title", "required");

    [Fact]
    public void A_title_longer_than_120_characters_is_too_long() => ShouldBreak(new(new string('a', 121)), "title", "too-long");

    [Fact]
    public void Game_and_venue_have_length_limits()
    {
        ShouldBreak(new("T", GameVariant: new string('a', 81)), "gameVariant", "too-long");
        ShouldBreak(new("T", Venue: new string('a', 121)), "venue", "too-long");
    }

    [Theory]
    [InlineData(1)]
    [InlineData(257)]
    public void Capacity_outside_2_to_256_is_out_of_range(int capacity) => ShouldBreak(new("T", Capacity: capacity), "capacity", "out-of-range");

    [Theory]
    [InlineData(2)]
    [InlineData(256)]
    public void Capacity_bounds_are_allowed(int capacity) => new TournamentConfiguration("T", Capacity: capacity).Check().ShouldBeEmpty();

    [Fact]
    public void A_roster_that_cannot_field_a_side_is_rejected() =>
        ShouldBreak(CompleteTeam with { MinimumRosterSize = null, MaximumRosterSize = 4 }, "maximumRosterSize", "below-active-players");

    [Fact]
    public void A_minimum_roster_below_the_active_players_is_rejected() =>
        ShouldBreak(CompleteTeam with { MinimumRosterSize = 4 }, "minimumRosterSize", "below-active-players");

    [Fact]
    public void A_maximum_roster_below_the_minimum_is_rejected() =>
        ShouldBreak(CompleteTeam with { ActivePlayersPerSide = 3, MinimumRosterSize = 5, MaximumRosterSize = 4 }, "maximumRosterSize", "below-minimum");

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    public void Roster_sizes_outside_1_to_50_are_out_of_range(int size) =>
        ShouldBreak(new("T", EntryKind: EntryKind.Team, MaximumRosterSize: size), "maximumRosterSize", "out-of-range");

    [Fact]
    public void An_individual_tournament_carries_no_team_structure() =>
        ShouldBreak(CompleteIndividual with { ActivePlayersPerSide = 5 }, "activePlayersPerSide", "not-applicable");

    [Fact]
    public void Registration_must_open_before_it_closes() =>
        ShouldBreak(CompleteIndividual with { RegistrationOpensAt = CompleteIndividual.RegistrationClosesAt }, "registrationClosesAt", "not-after-opening");

    [Fact]
    public void Registration_cannot_close_after_the_planned_start() =>
        ShouldBreak(CompleteIndividual with { RegistrationClosesAt = new DateTime(2026, 11, 14, 12, 0, 0) }, "registrationClosesAt", "after-planned-start");

    [Fact]
    public void Registration_may_close_at_the_planned_start() =>
        (CompleteIndividual with { RegistrationClosesAt = CompleteIndividual.PlannedStartAt }).Check().ShouldBeEmpty();

    [Fact]
    public void Date_rules_wait_for_both_values() =>
        new TournamentConfiguration("T", RegistrationClosesAt: new DateTime(2026, 11, 14, 12, 0, 0)).Check().ShouldBeEmpty();

    [Theory]
    [InlineData("Mars/Olympus")]
    [InlineData("Romance Standard Time")]
    public void A_time_zone_must_be_a_known_IANA_zone(string zone) => ShouldBreak(new("T", TimeZone: zone), "timeZone", "unknown");

    [Fact]
    public void An_hour_the_zone_skips_is_rejected() =>
        ShouldBreak(new("T", TimeZone: "Europe/Madrid", PlannedStartAt: new DateTime(2027, 3, 28, 2, 30, 0)), "plannedStartAt", "skipped-hour");

    [Fact]
    public void An_online_tournament_carries_no_venue() =>
        ShouldBreak(CompleteIndividual with { Location = LocationMode.Online }, "venue", "not-applicable");

    [Fact]
    public void Normalising_trims_text_and_reads_blank_as_absent()
    {
        var normalised = new TournamentConfiguration(" Saturday Open ", GameVariant: "  ", Venue: " Madrid ").Normalised();

        normalised.ShouldBe(new TournamentConfiguration("Saturday Open", Venue: "Madrid"));
    }

    [Fact]
    public void A_date_time_with_an_offset_marker_equals_the_same_local_time()
    {
        var utc = new TournamentConfiguration("T", PlannedStartAt: new DateTime(2026, 11, 14, 10, 0, 0, DateTimeKind.Utc)).Normalised();

        utc.PlannedStartAt!.Value.Kind.ShouldBe(DateTimeKind.Unspecified);
    }

    [Fact]
    public void A_complete_configuration_misses_nothing_for_publication()
    {
        CompleteIndividual.MissingForPublication().ShouldBeEmpty();
        CompleteTeam.MissingForPublication().ShouldBeEmpty();
    }

    [Fact]
    public void A_title_only_draft_misses_everything_but_registration_dates() =>
        new TournamentConfiguration("T").MissingForPublication().ShouldBe(
            ["gameVariant", "entryKind", "capacity", "plannedStartAt", "timeZone", "location", "admission", "checkIn", "visibility"]);

    [Fact]
    public void Registration_dates_are_not_needed_for_publication() =>
        (CompleteIndividual with { RegistrationOpensAt = null, RegistrationClosesAt = null }).MissingForPublication().ShouldBeEmpty();

    [Fact]
    public void A_team_tournament_needs_its_structure_for_publication() =>
        (CompleteTeam with { ActivePlayersPerSide = null }).MissingForPublication().ShouldBe(["activePlayersPerSide"]);

    [Fact]
    public void An_on_site_tournament_needs_a_venue_and_an_online_one_does_not()
    {
        (CompleteIndividual with { Venue = null }).MissingForPublication().ShouldBe(["venue"]);
        (CompleteIndividual with { Venue = null, Location = LocationMode.Online }).MissingForPublication().ShouldBeEmpty();
    }
}
