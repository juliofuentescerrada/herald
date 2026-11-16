namespace Herald.BuildingBlocks;

// The groups of operations an owner grants a pilot application (D-12): every organisation-scoped admin endpoint declares one.
public enum OperationGroup
{
    Read,
    Setup,
    Entries,
    Schedule,
    Results,
    Finalisation,
}
