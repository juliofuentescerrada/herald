using Herald.BuildingBlocks;

namespace Herald.Organisations.Domain;

public readonly record struct GrantId(Guid Value);

public sealed record GrantName
{
    public const int MaxLength = 80;

    private GrantName(string value) => Value = value;

    public string Value { get; }

    // The broken rule's code, or null when the name is acceptable.
    public static string? Check(string? raw) => raw?.Trim() switch
    {
        null or "" => "required",
        { Length: > MaxLength } => "too-long",
        _ => null,
    };

    public static GrantName Create(string? raw) => Check(raw) is { } rule
        ? throw new ArgumentException($"The application name breaks the rule '{rule}'.", nameof(raw))
        : new(raw!.Trim());
}

// What an owner allows a pilot application in one organisation (D-12, design D-2). Changing it is revoking it and granting
// again, so every grant an application held stays with who granted and revoked it and when.
public sealed class ApplicationGrant : AggregateRoot<GrantId>
{
    private List<Guid>? _tournaments;
    private List<OperationGroup> _groups = [];

    private ApplicationGrant(GrantId id, GrantName name, PersonId grantedBy, DateTimeOffset grantedAt)
        : base(id)
    {
        Name = name;
        GrantedBy = grantedBy;
        GrantedAt = grantedAt;
    }

    public GrantName Name { get; private set; }

    public IdentityKey Application
    {
        get => new(DirectoryId, ObjectId);
        private set => (DirectoryId, ObjectId) = (value.DirectoryId, value.ObjectId);
    }

    // Stored apart so persistence can index them; the domain reads Application.
    private Guid DirectoryId { get; set; }

    private Guid ObjectId { get; set; }

    // Null when the grant covers all of the organisation's tournaments.
    public IReadOnlyList<Guid>? Tournaments => _tournaments;

    public IReadOnlyList<OperationGroup> Groups => _groups;

    public PersonId GrantedBy { get; private set; }

    public DateTimeOffset GrantedAt { get; private set; }

    public PersonId? RevokedBy { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public bool Active => RevokedAt is null;

    public static ApplicationGrant Grant(
        GrantId id, GrantName name, IdentityKey application, IEnumerable<Guid>? tournaments, IEnumerable<OperationGroup> groups,
        PersonId grantedBy, DateTimeOffset at)
    {
        var grant = new ApplicationGrant(id, name, grantedBy, at)
        {
            Application = application,
            _tournaments = tournaments?.Distinct().Order().ToList(),
            _groups = [.. groups.Distinct().Order()],
        };
        if (grant._groups.Count == 0 || grant._tournaments is [])
        {
            throw new ArgumentException("A grant covers at least one operation group and, when selected, one tournament.");
        }

        return grant;
    }

    // A repeat of a grant attempt with the same identifier, when its content matches (as for organisations, D-5).
    public bool Repeats(GrantName name, IdentityKey application, IEnumerable<Guid>? tournaments, IEnumerable<OperationGroup> groups) =>
        Name == name && Application == application
        && (tournaments is null ? _tournaments is null : _tournaments?.SequenceEqual(tournaments.Distinct().Order()) == true)
        && _groups.SequenceEqual(groups.Distinct().Order());

    // Final for this grant; revoking it again changes nothing and keeps the first revocation.
    public void Revoke(PersonId by, DateTimeOffset at)
    {
        if (Active)
        {
            (RevokedBy, RevokedAt) = (by, at);
        }
    }
}
