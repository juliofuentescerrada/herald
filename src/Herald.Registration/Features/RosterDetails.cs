using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Herald.Registration.Features;

// A team entry of the tournament, named by its guest team.
public sealed record RosterTeam(Guid EntryId, string Name);

// PossibleDuplicateOf names an active team holding a different guest with the same name (R-5).
public sealed record RosterMemberDetails(Guid GuestId, string Name, DateTimeOffset AddedAt, RosterTeam? PossibleDuplicateOf);

public sealed record RosterChangeDetails(int RosterRevision, Guid GuestId, string Name, RosterChangeKind Kind, Guid ChangedBy, DateTimeOffset ChangedAt);

// What roster writes and the roster read answer with: members in the order added, history oldest first.
public sealed record RosterDetails(
    Guid EntryId,
    string TeamName,
    EntryState EntryState,
    int Revision,
    int? MinimumRosterSize,
    int? MaximumRosterSize,
    RosterReadiness Readiness,
    IReadOnlyList<RosterMemberDetails> Members,
    IReadOnlyList<RosterChangeDetails> History)
{
    public static async Task<RosterDetails> OfAsync(Field field, Entry entry, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var others = field.Entries.Where(other => other.IsActive && other.Id != entry.Id).ToList();
        var guestIds = others.SelectMany(other => other.Members.Select(member => member.GuestId))
            .Concat(entry.RosterChanges.Select(change => change.GuestId))
            .Concat(field.Entries.Select(team => team.GuestId))
            .Distinct()
            .ToList();
        var guests = await db.Guests.AsNoTracking().Where(guest => guestIds.Contains(guest.Id)).ToDictionaryAsync(guest => guest.Id, cancellationToken);
        string NameOf(GuestId id) => guests.TryGetValue(id, out var guest) ? guest.Name : "";

        RosterTeam? DuplicateOf(GuestId player)
        {
            var name = guests.GetValueOrDefault(player)?.NormalisedName;
            var team = others.Find(other => other.Members.Any(member => member.GuestId != player && guests.GetValueOrDefault(member.GuestId)?.NormalisedName == name));
            return name is null || team is null ? null : new(team.Id.Value, NameOf(team.GuestId));
        }

        return new(
            entry.Id.Value,
            NameOf(entry.GuestId),
            entry.State,
            entry.RosterRevision,
            field.Terms.MinimumRosterSize,
            field.Terms.MaximumRosterSize,
            field.ReadinessOf(entry)!.Value,
            [.. entry.Members.OrderBy(member => member.AddedAt).Select(member => new RosterMemberDetails(member.GuestId.Value, NameOf(member.GuestId), member.AddedAt, DuplicateOf(member.GuestId)))],
            [.. entry.RosterChanges.OrderBy(change => change.RosterRevision)
                .Select(change => new RosterChangeDetails(change.RosterRevision, change.GuestId.Value, NameOf(change.GuestId), change.Kind, change.ChangedBy, change.ChangedAt))]);
    }
}

internal static class RosterTeams
{
    public static async Task<Dictionary<GuestId, string>> NamesAsync(Field field, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        var teamIds = field.Entries.Select(entry => entry.GuestId).ToList();
        return await db.Guests.AsNoTracking().Where(guest => teamIds.Contains(guest.Id)).ToDictionaryAsync(guest => guest.Id, guest => guest.Name, cancellationToken);
    }
}

internal static class RosterResults
{
    public const string RosterRevisionConflict = "roster-revision-conflict";

    private const int Attempts = 3;

    // Loads the field, applies the roster write and saves it. A tournament, entry or guest of another
    // organisation is as absent as a missing one; an individual tournament has no rosters.
    public static async Task<IResult> WriteAsync(
        this RegistrationDbContext db,
        Guid tournamentId,
        EntryId entryId,
        GuestId player,
        Func<Field, WriteResult> write,
        CancellationToken cancellationToken)
    {
        var id = new TournamentId(tournamentId);
        for (var attempt = 1; ; attempt++)
        {
            if (await db.Fields.SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is not { } field || field.Find(entryId) is not { } entry)
            {
                return FieldResults.NotFound();
            }

            var result = write(field);
            switch (result.Outcome)
            {
                case WriteOutcome.Rejected:
                    return await RejectedAsync(field, entryId, player, result.Broken, db, cancellationToken);
                case WriteOutcome.Stale:
                    return Results.Problem(
                        statusCode: StatusCodes.Status409Conflict,
                        title: "Conflict",
                        type: RosterRevisionConflict,
                        extensions: new Dictionary<string, object?>
                        {
                            ["currentRevision"] = entry.RosterRevision,
                            ["roster"] = await RosterDetails.OfAsync(field, entry, db, cancellationToken),
                        });
                case WriteOutcome.Applied:
                    try
                    {
                        await db.SaveChangesAsync(cancellationToken);
                    }
                    catch (DbUpdateConcurrencyException) when (attempt < Attempts)
                    {
                        // Another write on the field was first; the next attempt decides exclusivity again.
                        db.ChangeTracker.Clear();
                        continue;
                    }

                    break;
            }

            return Results.Ok(await RosterDetails.OfAsync(field, entry, db, cancellationToken));
        }
    }

    // A player on another team's roster is refused with that team (design D-5).
    private static async Task<IResult> RejectedAsync(
        Field field, EntryId entryId, GuestId player, IReadOnlyList<BrokenRule> broken, RegistrationDbContext db, CancellationToken cancellationToken)
    {
        if (broken is not [{ Rule: "on-another-team" }] || field.TeamOf(player, entryId) is not { } team)
        {
            return FieldResults.Rejected(broken);
        }

        var names = await RosterTeams.NamesAsync(field, db, cancellationToken);
        return Results.ValidationProblem(
            new Dictionary<string, string[]> { ["guestId"] = ["on-another-team"] },
            extensions: new Dictionary<string, object?> { ["team"] = new RosterTeam(team.Id.Value, names.GetValueOrDefault(team.GuestId, "")) });
    }
}
