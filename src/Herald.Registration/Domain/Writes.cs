namespace Herald.Registration.Domain;

public readonly record struct BrokenRule(string Field, string Rule);

public enum WriteOutcome
{
    Applied,

    // The write is already in effect: a retry, answered with the current state.
    Repeated,

    // Based on an older revision: nothing changes.
    Stale,

    Rejected,
}

public readonly record struct WriteResult(WriteOutcome Outcome, IReadOnlyList<BrokenRule> Broken)
{
    public static implicit operator WriteResult(WriteOutcome outcome) => new(outcome, []);

    public static WriteResult Reject(string field, string rule) => new(WriteOutcome.Rejected, [new(field, rule)]);
}
