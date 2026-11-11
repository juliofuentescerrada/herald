namespace Herald.Tournaments.Domain;

public enum EntryKind
{
    Individual,
    Team,
}

public enum LocationMode
{
    OnSite,
    Online,
}

public enum Admission
{
    Automatic,
    Manual,
}

public enum CheckIn
{
    Optional,
    Mandatory,
}

public enum Visibility
{
    Public,
    Unlisted,
    Private,
}

// A configuration field and the code of the rule it breaks; field names are the API's.
public readonly record struct BrokenRule(string Field, string Rule);

// What an owner configures. Only the title is always present: a draft may lack anything else (F-02).
// Date-times are local to the reference time zone; nothing acts at an instant yet.
public sealed record TournamentConfiguration(
    string Title,
    string? GameVariant = null,
    EntryKind? EntryKind = null,
    int? Capacity = null,
    int? MinimumRosterSize = null,
    int? MaximumRosterSize = null,
    int? ActivePlayersPerSide = null,
    DateTime? RegistrationOpensAt = null,
    DateTime? RegistrationClosesAt = null,
    DateTime? PlannedStartAt = null,
    string? TimeZone = null,
    LocationMode? Location = null,
    string? Venue = null,
    Admission? Admission = null,
    CheckIn? CheckIn = null,
    Visibility? Visibility = null)
{
    public const int TitleMaxLength = 120;
    public const int GameVariantMaxLength = 80;
    public const int VenueMaxLength = 120;
    public const int TimeZoneMaxLength = 64;
    public const int MinCapacity = 2;
    public const int MaxCapacity = 256;
    public const int MaxRosterSize = 50;

    // Trimmed text, blank as absent, date-times without an offset: two equal configurations compare equal.
    public TournamentConfiguration Normalised() => this with
    {
        Title = Title?.Trim() ?? "",
        GameVariant = Text(GameVariant),
        TimeZone = Text(TimeZone),
        Venue = Text(Venue),
        RegistrationOpensAt = Local(RegistrationOpensAt),
        RegistrationClosesAt = Local(RegistrationClosesAt),
        PlannedStartAt = Local(PlannedStartAt),
    };

    // The rules every save obeys. A rule that compares two values applies only when both are present.
    public IReadOnlyList<BrokenRule> Check()
    {
        var broken = new List<BrokenRule>();
        void Break(string field, string rule) => broken.Add(new(field, rule));

        if (Title.Length == 0)
        {
            Break("title", "required");
        }
        else if (Title.Length > TitleMaxLength)
        {
            Break("title", "too-long");
        }

        if (GameVariant?.Length > GameVariantMaxLength)
        {
            Break("gameVariant", "too-long");
        }

        if (Capacity is < MinCapacity or > MaxCapacity)
        {
            Break("capacity", "out-of-range");
        }

        (string Field, int? Value)[] team =
        [
            ("minimumRosterSize", MinimumRosterSize), ("maximumRosterSize", MaximumRosterSize), ("activePlayersPerSide", ActivePlayersPerSide),
        ];
        foreach (var (field, value) in team)
        {
            if (value is not null && EntryKind != Domain.EntryKind.Team)
            {
                Break(field, "not-applicable");
            }
            else if (value is < 1 or > MaxRosterSize)
            {
                Break(field, "out-of-range");
            }
        }

        if (MinimumRosterSize < ActivePlayersPerSide)
        {
            Break("minimumRosterSize", "below-active-players");
        }

        if (MaximumRosterSize < MinimumRosterSize)
        {
            Break("maximumRosterSize", "below-minimum");
        }
        else if (MaximumRosterSize < ActivePlayersPerSide)
        {
            Break("maximumRosterSize", "below-active-players");
        }

        if (RegistrationClosesAt <= RegistrationOpensAt)
        {
            Break("registrationClosesAt", "not-after-opening");
        }
        else if (RegistrationClosesAt > PlannedStartAt)
        {
            Break("registrationClosesAt", "after-planned-start");
        }

        if (TimeZone is not null)
        {
            // IANA only: the identifier is announced and other systems must read it.
            if (TimeZone.Length > TimeZoneMaxLength || !TimeZoneInfo.TryFindSystemTimeZoneById(TimeZone, out var zone) || !zone.HasIanaId)
            {
                Break("timeZone", "unknown");
            }
            else
            {
                (string Field, DateTime? Value)[] times =
                [
                    ("registrationOpensAt", RegistrationOpensAt), ("registrationClosesAt", RegistrationClosesAt), ("plannedStartAt", PlannedStartAt),
                ];
                foreach (var (field, value) in times)
                {
                    // shortcut: an hour the zone repeats is accepted and means its first occurrence; decide when a slice acts at instants.
                    if (value is { } time && zone.IsInvalidTime(time))
                    {
                        Break(field, "skipped-hour");
                    }
                }
            }
        }

        if (Venue is not null && Location == LocationMode.Online)
        {
            Break("venue", "not-applicable");
        }
        else if (Venue?.Length > VenueMaxLength)
        {
            Break("venue", "too-long");
        }

        return broken;
    }

    // CP-01: what publication still needs. Registration dates are required when registration opens, not here.
    public IReadOnlyList<string> MissingForPublication()
    {
        var missing = new List<string>();
        void Require(string field, bool present)
        {
            if (!present)
            {
                missing.Add(field);
            }
        }

        Require("gameVariant", GameVariant is not null);
        Require("entryKind", EntryKind is not null);
        Require("capacity", Capacity is not null);
        if (EntryKind == Domain.EntryKind.Team)
        {
            Require("minimumRosterSize", MinimumRosterSize is not null);
            Require("maximumRosterSize", MaximumRosterSize is not null);
            Require("activePlayersPerSide", ActivePlayersPerSide is not null);
        }

        Require("plannedStartAt", PlannedStartAt is not null);
        Require("timeZone", TimeZone is not null);
        Require("location", Location is not null);
        if (Location == LocationMode.OnSite)
        {
            Require("venue", Venue is not null);
        }

        Require("admission", Admission is not null);
        Require("checkIn", CheckIn is not null);
        Require("visibility", Visibility is not null);
        return missing;
    }

    private static string? Text(string? raw) => string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();

    private static DateTime? Local(DateTime? value) => value is { } time ? DateTime.SpecifyKind(time, DateTimeKind.Unspecified) : null;
}
