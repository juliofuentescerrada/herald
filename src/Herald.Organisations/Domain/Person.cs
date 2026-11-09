using Herald.BuildingBlocks;

namespace Herald.Organisations.Domain;

public readonly record struct PersonId(Guid Value)
{
    public static PersonId New() => new(Guid.CreateVersion7());
}

// The directory's tenant and object ids: the only identity Herald trusts (ADR 0014).
public readonly record struct IdentityKey(Guid DirectoryId, Guid ObjectId);

public sealed class Person : AggregateRoot<PersonId>
{
    private Person(PersonId id, IdentityKey identity, string displayName)
        : base(id)
    {
        Identity = identity;
        DisplayName = displayName;
    }

    // For EF Core, which sets the identity columns itself.
    private Person(PersonId id, string displayName)
        : base(id) => DisplayName = displayName;

    public IdentityKey Identity
    {
        get => new(DirectoryId, ObjectId);
        private set => (DirectoryId, ObjectId) = (value.DirectoryId, value.ObjectId);
    }

    // Stored apart so persistence can index them; the domain reads Identity.
    private Guid DirectoryId { get; set; }

    private Guid ObjectId { get; set; }

    // Refreshed from the token; shown, never used to identify.
    public string DisplayName { get; private set; }

    public static Person Register(IdentityKey identity, string? displayName) =>
        new(PersonId.New(), identity, displayName?.Trim() ?? "");

    public void RefreshDisplayName(string? displayName) => DisplayName = displayName?.Trim() ?? "";

    // D-6: moves the identity key only; whether the new key is free is the caller's check.
    public IdentityRelink Relink(IdentityKey identity, string @operator, string reason, DateTimeOffset at)
    {
        if (string.IsNullOrWhiteSpace(@operator) || string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A relink records its operator and reason.");
        }

        if (identity == Identity)
        {
            throw new ArgumentException("The person already has this identity.", nameof(identity));
        }

        var relink = new IdentityRelink(Guid.CreateVersion7(), Id, Identity, identity, @operator.Trim(), reason.Trim(), at);
        Identity = identity;
        return relink;
    }
}

// The durable record of a support relink (ADR 0007).
public sealed record IdentityRelink(
    Guid Id,
    PersonId PersonId,
    IdentityKey Previous,
    IdentityKey Current,
    string Operator,
    string Reason,
    DateTimeOffset At)
{
    // For EF Core, which cannot bind complex properties to constructor parameters.
    private IdentityRelink()
        : this(default, default, default, default, "", "", default)
    {
    }
}
