using Herald.Contracts.Registration.V1;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace Herald.Registration.Features;

// One entry as the owner sees it. The admission reason is private and not returned (EN-7).
public sealed record EntryDetails(
    Guid Id,
    int Revision,
    Guid GuestId,
    string GuestName,
    EntryState State,
    WaitingReason? WaitingReason,
    int? Position,
    DateTimeOffset EnteredAt,
    DateTimeOffset? WaitingSince,
    AdmissionMethod? AdmissionMethod,
    DateTimeOffset? AdmittedAt,
    DateTimeOffset? CancelledAt);

// What every entry write and the field read answer with: admitted, then waiting in order, then cancelled.
public sealed record FieldDetails(
    Guid TournamentId,
    int Revision,
    EntryTerms Terms,
    DateTimeOffset TermsReceivedAt,
    int Admitted,
    int Waiting,
    int OverCapacityBy,
    bool KindMismatch,
    IReadOnlyList<EntryDetails> Entries)
{
    public static async Task<FieldDetails> OfAsync(Field field, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var guestIds = field.Entries.Select(entry => entry.GuestId).Distinct().ToList();
        var names = await db.Guests.AsNoTracking()
            .Where(guest => guestIds.Contains(guest.Id))
            .ToDictionaryAsync(guest => guest.Id, guest => guest.Name, cancellationToken);
        var queue = field.Queue.ToList();

        EntryDetails Of(Entry entry) => new(
            entry.Id.Value,
            entry.Revision,
            entry.GuestId.Value,
            names.GetValueOrDefault(entry.GuestId, ""),
            entry.State,
            entry.WaitingReason,
            entry.State == EntryState.Waiting ? queue.IndexOf(entry) + 1 : null,
            entry.EnteredAt,
            entry.WaitingSince,
            entry.AdmissionMethod,
            entry.AdmittedAt,
            entry.CancelledAt);

        var admitted = field.Entries.Where(entry => entry.State == EntryState.Admitted).OrderBy(entry => entry.AdmittedAt).ThenBy(entry => entry.Sequence);
        var cancelled = field.Entries.Where(entry => entry.State == EntryState.Cancelled).OrderByDescending(entry => entry.CancelledAt);
        return new(
            field.Id.Value,
            field.Revision,
            field.Terms,
            field.TermsReceivedAt,
            field.Admitted,
            field.Waiting,
            field.OverCapacityBy,
            field.HasKindMismatch,
            [.. admitted.Concat(queue).Concat(cancelled).Select(Of)]);
    }

    // The counts Tournaments keeps for its own rules and reads (design D-2).
    public static TournamentFieldChanged Changed(Guid organisationId, Field field) =>
        new(organisationId, field.Id.Value, field.Revision, field.Admitted, field.Waiting);
}

internal static class FieldResults
{
    public const string EntryRevisionConflict = "entry-revision-conflict";

    // Lost races on the same field are tried again: the owner's write is not stale, another one was first.
    private const int Attempts = 3;

    // The same answer for a tournament or entry that does not exist and for another organisation's.
    public static IResult NotFound() => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found");

    public static IResult Rejected(IReadOnlyList<BrokenRule> broken) => Results.ValidationProblem(
        broken.GroupBy(rule => rule.Field).ToDictionary(field => field.Key, field => field.Select(rule => rule.Rule).ToArray()));

    // Loads the field, applies the write and saves it with its counts event in the same transaction.
    public static async Task<IResult> WriteAsync(
        this RegistrationDbContext db,
        IMessageBus bus,
        Guid organisationId,
        Guid tournamentId,
        EntryId? existingEntry,
        Func<Field, WriteResult> write,
        CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Fields.SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is not { } field
                || (existingEntry is { } entryId && field.Find(entryId) is null))
            {
                return NotFound();
            }

            var result = write(field);
            switch (result.Outcome)
            {
                case WriteOutcome.Rejected:
                    return Rejected(result.Broken);
                case WriteOutcome.Stale:
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        type: EntryRevisionConflict,
                        extensions: new Dictionary<string, object?> { ["currentRevision"] = field.Find(existingEntry!.Value)!.Revision });
                case WriteOutcome.Applied:
                    try
                    {
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateConcurrencyException) when (attempt < Attempts)
                    {
                        db.ChangeTracker.Clear();
                        continue;
                    }

                    // Stored with the change by the transaction around the endpoint, sent after its commit.
                    await bus.PublishAsync(FieldDetails.Changed(organisationId, field));
                    break;
            }

            return Results.Ok(await FieldDetails.OfAsync(field, db, cancellationToken));
        }
    }
}
