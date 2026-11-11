using Herald.Registration.Domain;
using Microsoft.AspNetCore.Http;

namespace Herald.Registration.Features;

// What guest writes and reads answer with. Creation time tells same-name guests apart (design V-1).
// Team is set when guests are found for a tournament and the player is on an active team's roster there.
public sealed record GuestDetails(Guid Id, GuestKind Kind, string Name, DateTimeOffset CreatedAt, RosterTeam? Team = null)
{
    public static GuestDetails Of(Guest guest, RosterTeam? team = null) => new(guest.Id.Value, guest.Kind, guest.Name, guest.CreatedAt, team);
}

// A guest creation refused because of another guest: a possible duplicate lists its matches; a reused identifier lists none.
public sealed record GuestConflict(string Type, string Title, int Status, IReadOnlyList<GuestDetails> Matches);

internal static class GuestResults
{
    public const string PossibleDuplicate = "possible-duplicate";
    public const string IdentifierReused = "guest-identifier-reused";

    public static IResult Conflict(string type, IReadOnlyList<GuestDetails> matches) => Results.Json(
        new GuestConflict(type, "Conflict", StatusCodes.Status409Conflict, matches),
        statusCode: StatusCodes.Status409Conflict,
        contentType: "application/problem+json");
}
