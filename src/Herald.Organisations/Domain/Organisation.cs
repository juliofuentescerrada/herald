using Herald.BuildingBlocks;

namespace Herald.Organisations.Domain;

public readonly record struct OrganisationId(Guid Value);

public sealed record OrganisationName
{
    public const int MaxLength = 80;

    private OrganisationName(string value) => Value = value;

    public string Value { get; }

    // The broken rule's code, or null when the name is acceptable (A-1: lengths in UTF-16 units).
    public static string? Check(string? raw) => raw?.Trim() switch
    {
        null or "" => "required",
        { Length: > MaxLength } => "too-long",
        _ => null,
    };

    public static OrganisationName Create(string? raw) => Check(raw) is { } rule
        ? throw new ArgumentException($"The organisation name breaks the rule '{rule}'.", nameof(raw))
        : new(raw!.Trim());
}

public enum MembershipRole
{
    Owner,
}

public sealed class Membership(PersonId personId, MembershipRole role)
{
    public PersonId PersonId { get; private set; } = personId;

    public MembershipRole Role { get; private set; } = role;
}

public sealed record OrganisationCreated(OrganisationId OrganisationId, PersonId CreatedBy, DateTimeOffset CreatedAt) : IDomainEvent;

public sealed class Organisation : AggregateRoot<OrganisationId>
{
    private readonly List<Membership> _memberships = [];

    private Organisation(OrganisationId id, OrganisationName name, PersonId createdBy, DateTimeOffset createdAt)
        : base(id)
    {
        Name = name;
        CreatedBy = createdBy;
        CreatedAt = createdAt;
    }

    public OrganisationName Name { get; private set; }

    public PersonId CreatedBy { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public IReadOnlyCollection<Membership> Memberships => _memberships;

    // H1 has exactly one owner, the creator; collaborators and transfer arrive in H2.
    public PersonId Owner => _memberships.Single(membership => membership.Role == MembershipRole.Owner).PersonId;

    public static Organisation Create(OrganisationId id, OrganisationName name, PersonId creator, DateTimeOffset at)
    {
        var organisation = new Organisation(id, name, creator, at);
        organisation._memberships.Add(new Membership(creator, MembershipRole.Owner));
        organisation.Raise(new OrganisationCreated(id, creator, at));
        return organisation;
    }

    // D-5: a creation with the same identifier is a retry only when its content matches.
    public bool Repeats(OrganisationName name, PersonId creator) => Name == name && CreatedBy == creator;
}
