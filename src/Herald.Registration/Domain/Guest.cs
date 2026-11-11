using System.Globalization;
using System.Text;
using Herald.BuildingBlocks;

namespace Herald.Registration.Domain;

public readonly record struct GuestId(Guid Value);

public enum GuestKind
{
    Player,
    Team,
}

// Actors are person identifiers of the Organisations module, opaque here.
public sealed record GuestCreated(GuestId GuestId, GuestKind Kind, Guid CreatedBy, DateTimeOffset CreatedAt) : IDomainEvent;

// A player or team the owner manages in the organisation (D-22): no sign-in, no contact details.
// Its name is the alias shown for it.
public sealed class Guest : AggregateRoot<GuestId>
{
    public const int NameMaxLength = 80;

    // For EF Core.
    private Guest(GuestId id)
        : base(id)
    {
        Name = NormalisedName = "";
    }

    private Guest(GuestId id, GuestKind kind, string name, Guid actor, DateTimeOffset at)
        : base(id)
    {
        Kind = kind;
        Name = name;
        NormalisedName = Normalise(name);
        CreatedBy = actor;
        CreatedAt = at;
    }

    public GuestKind Kind { get; private set; }

    public string Name { get; private set; }

    // Compared to find possible duplicates (EN-11); never shown.
    public string NormalisedName { get; private set; }

    public Guid CreatedBy { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public static IReadOnlyList<BrokenRule> Check(string? name) => name?.Trim() switch
    {
        null or "" => [new("name", "required")],
        { Length: > NameMaxLength } => [new("name", "too-long")],
        _ => [],
    };

    public static Guest Create(GuestId id, GuestKind kind, string name, Guid actor, DateTimeOffset at)
    {
        if (Check(name) is { Count: > 0 } broken)
        {
            throw new ArgumentException($"The name breaks {broken[0].Rule}.", nameof(name));
        }

        var guest = new Guest(id, kind, name.Trim(), actor, at);
        guest.Raise(new GuestCreated(id, kind, actor, at));
        return guest;
    }

    // A creation with the same identifier is a retry only when its content matches.
    public bool Repeats(GuestKind kind, string name) => Kind == kind && Name == name.Trim();

    // Case, accents and repeated or surrounding spaces do not tell two names apart (EN-11).
    public static string Normalise(string name)
    {
        var decomposed = name.Normalize(NormalizationForm.FormD);
        var letters = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                letters.Append(character);
            }
        }

        var words = letters.ToString().Normalize(NormalizationForm.FormC).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', words).ToLowerInvariant();
    }
}
