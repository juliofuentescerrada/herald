namespace Herald.BuildingBlocks;

// A fact an aggregate records as it changes; it never leaves its module (ADR 0006).
public interface IDomainEvent;

public abstract class Entity<TId>(TId id)
    where TId : notnull
{
    public TId Id { get; } = id;
}

public abstract class AggregateRoot<TId>(TId id) : Entity<TId>(id)
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents;

    protected void Raise(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
