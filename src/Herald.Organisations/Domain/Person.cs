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

    public IdentityKey Identity { get; private set; }

    // Refreshed from the token; shown, never used to identify.
    public string DisplayName { get; private set; }

    public static Person Register(IdentityKey identity, string? displayName) =>
        new(PersonId.New(), identity, displayName?.Trim() ?? "");

    public void RefreshDisplayName(string? displayName) => DisplayName = displayName?.Trim() ?? "";
}
