using Herald.BuildingBlocks;

namespace Herald.ModuleHosting;

// The group an organisation-scoped admin endpoint belongs to, checked against an application's grant (design D-3). AllTournaments
// marks an endpoint without a tournament route that reaches every tournament, such as the list: only a grant for all of them allows it.
[AttributeUsage(AttributeTargets.Method)]
public sealed class OperationGroupAttribute(OperationGroup group) : Attribute
{
    public OperationGroup Group { get; } = group;

    public bool AllTournaments { get; init; }
}

// An organisation-scoped admin endpoint no application may call, whatever its grant: managing the grants themselves.
[AttributeUsage(AttributeTargets.Method)]
public sealed class PeopleOnlyAttribute : Attribute;
