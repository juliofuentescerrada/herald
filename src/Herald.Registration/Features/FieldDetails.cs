using Herald.Contracts.Registration.V1;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Wolverine;

namespace Herald.Registration.Features;

// One entry as the owner sees it. The admission reason is private and not returned (EN-7).
// The roster values are set for a team tournament only; the check-in values for an entry that was admitted.
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
    DateTimeOffset? CancelledAt,
    int? RosterSize = null,
    int? RosterRevision = null,
    RosterReadiness? RosterReadiness = null,
    CheckInState? CheckIn = null,
    int? CheckInRevision = null,
    DateTimeOffset? CheckInChangedAt = null,
    CancellationCause? CancellationCause = null);

public enum CheckInState
{
    Pending,
    Confirmed,
}

// What every entry write and the field read answer with: admitted, then waiting in order, then cancelled.
public sealed record FieldDetails(
    Guid TournamentId,
    int Revision,
    EntryTerms Terms,
    DateTimeOffset TermsReceivedAt,
    int Admitted,
    int Waiting,
    int CheckedIn,
    int Pending,
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
            entry.CancelledAt,
            field.Terms.EntryKind == EntryKind.Team ? entry.Members.Count : null,
            field.Terms.EntryKind == EntryKind.Team ? entry.RosterRevision : null,
            field.ReadinessOf(entry),
            entry.HasCheckIn ? entry.IsCheckedIn ? CheckInState.Confirmed : CheckInState.Pending : null,
            entry.HasCheckIn ? entry.CheckInRevision : null,
            entry.CheckInChanges is [.., var last] ? last.ChangedAt : null,
            entry.CancellationCause);

        var admitted = field.Entries.Where(entry => entry.State == EntryState.Admitted).OrderBy(entry => entry.AdmittedAt).ThenBy(entry => entry.Sequence);
        var cancelled = field.Entries.Where(entry => entry.State == EntryState.Cancelled).OrderByDescending(entry => entry.CancelledAt);
        return new(
            field.Id.Value,
            field.Revision,
            field.Terms,
            field.TermsReceivedAt,
            field.Admitted,
            field.Waiting,
            field.CheckedIn,
            field.Pending,
            field.OverCapacityBy,
            field.HasKindMismatch,
            [.. admitted.Concat(queue).Concat(cancelled).Select(Of)]);
    }

    // The counts Tournaments keeps for its own rules and reads (design D-2), with what start readiness needs
    // (h1-competition-start D-2): rosters outside their bounds and member names shared across admitted teams.
    public static async Task<TournamentFieldChanged> ChangedAsync(Guid organisationId, Field field, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var teams = field.Entries.Where(entry => entry.State == EntryState.Admitted && entry.GuestKind == GuestKind.Team).ToList();
        var guestIds = teams.Select(team => team.GuestId).Concat(teams.SelectMany(team => team.Members.Select(member => member.GuestId))).Distinct().ToList();
        var guests = guestIds.Count == 0 ? [] : await db.Guests.AsNoTracking()
            .Where(guest => guestIds.Contains(guest.Id))
            .ToDictionaryAsync(guest => guest.Id, cancellationToken);
        string NameOf(GuestId id) => guests.TryGetValue(id, out var guest) ? guest.Name : "";

        var shared = teams
            .SelectMany(team => team.Members.Where(member => guests.ContainsKey(member.GuestId)).Select(member => (Team: team, Guest: guests[member.GuestId])))
            .GroupBy(held => held.Guest.NormalisedName)
            .Where(name => name.Select(held => held.Guest.Id).Distinct().Count() > 1 && name.Select(held => held.Team.Id).Distinct().Count() > 1)
            .Select(name => new SharedMemberName(name.First().Guest.Name, [.. name.Select(held => NameOf(held.Team.GuestId)).Distinct()]))
            .ToList();
        return new(
            organisationId,
            field.Id.Value,
            field.Revision,
            field.Admitted,
            field.Waiting,
            field.CheckedIn,
            field.EligibleRevision,
            field.Eligible.Count,
            field.Pending,
            [.. field.RostersOutsideBounds.Select(team => new RosterOutsideBounds(team.Id.Value, NameOf(team.GuestId), team.Members.Count))],
            shared);
    }

    // The eligible entrants Competition drafts from (h1-round-robin-pairings D-2).
    public static async Task<TournamentEligibleFieldChanged> EligibleAsync(Guid organisationId, Field field, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var eligible = field.Eligible;
        var pending = field.PendingEntries;
        var guestIds = eligible.Select(entry => entry.Entry.GuestId).Concat(pending.Select(entry => entry.GuestId)).ToList();
        var names = await db.Guests.AsNoTracking()
            .Where(guest => guestIds.Contains(guest.Id))
            .ToDictionaryAsync(guest => guest.Id, guest => guest.Name, cancellationToken);
        return new(
            organisationId,
            field.Id.Value,
            field.EligibleRevision,
            field.Terms.Registration == RegistrationState.Closed,
            [.. pending.Select(entry => new PendingEntrant(entry.Id.Value, names.GetValueOrDefault(entry.GuestId, "")))],
            [.. eligible.Select(entry => new EligibleEntrant(entry.Entry.Id.Value, names.GetValueOrDefault(entry.Entry.GuestId, ""), entry.AdmissionOrder))]);
    }

    // The rosters frozen at start, for Competition's lineups (h1-match-lineups D-4); the field's revision orders them.
    public static async Task<TournamentFrozenRostersChanged> FrozenRostersAsync(Guid organisationId, Field field, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var teams = field.Entries.Where(entry => entry.FrozenRosterRevision is not null).ToList();
        var guestIds = teams.SelectMany(team => team.Members.Select(member => member.GuestId)).ToList();
        var names = await db.Guests.AsNoTracking()
            .Where(guest => guestIds.Contains(guest.Id))
            .ToDictionaryAsync(guest => guest.Id, guest => guest.Name, cancellationToken);
        return new(
            organisationId,
            field.Id.Value,
            field.Revision,
            [.. teams.Select(team => new FrozenRoster(
                team.Id.Value,
                team.FrozenRosterRevision!.Value,
                [.. team.Members.Select(member => new FrozenRosterMember(member.GuestId.Value, names.GetValueOrDefault(member.GuestId, "")))]))]);
    }

    // Both snapshots, in the transaction of the change; the eligible one only when it changed.
    public static async Task PublishAsync(IMessageBus bus, Guid organisationId, Field field, int eligibleRevisionBefore, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        await bus.PublishAsync(await ChangedAsync(organisationId, field, db, cancellationToken));
        if (field.EligibleRevision != eligibleRevisionBefore)
        {
            await bus.PublishAsync(await EligibleAsync(organisationId, field, db, cancellationToken));
        }
    }
}

internal static class FieldResults
{
    public const string EntryRevisionConflict = "entry-revision-conflict";
    public const string CheckInRevisionConflict = "check-in-revision-conflict";

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
        CancellationToken cancellationToken,
        bool checkIn = false)
    {
        var id = new TournamentId(tournamentId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Fields.SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is not { } field
                || (existingEntry is { } entryId && field.Find(entryId) is null))
            {
                return NotFound();
            }

            var eligibleRevision = field.EligibleRevision;
            var result = field.IsTournamentCancelled ? Field.Cancelled : write(field);
            switch (result.Outcome)
            {
                case WriteOutcome.Rejected:
                    return Rejected(result.Broken);
                case WriteOutcome.Stale:
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        type: checkIn ? CheckInRevisionConflict : EntryRevisionConflict,
                        extensions: new Dictionary<string, object?> { ["currentRevision"] = CurrentRevision(field.Find(existingEntry!.Value)!, checkIn) });
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
                    await FieldDetails.PublishAsync(bus, organisationId, field, eligibleRevision, db, cancellationToken);
                    break;
            }

            return Results.Ok(await FieldDetails.OfAsync(field, db, cancellationToken));
        }
    }

    // Check-in writes state their own revision, apart from the entry's (h1-check-in D-2).
    private static int CurrentRevision(Entry entry, bool checkIn) => checkIn ? entry.CheckInRevision : entry.Revision;
}
