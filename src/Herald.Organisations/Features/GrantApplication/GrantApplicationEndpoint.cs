using Herald.BuildingBlocks;
using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Wolverine.Http;

namespace Herald.Organisations.Features.GrantApplication;

// The client generates the grant's identifier and keeps it for retries. ApplicationId is the application's object identifier in
// Herald's directory, as the provisioning record gives it (design A-1); Tournaments null covers all of the organisation's.
public sealed record GrantApplication(string? Name, Guid? ApplicationId, IReadOnlyList<Guid>? Tournaments, IReadOnlyList<OperationGroup>? Groups);

public static class GrantApplicationEndpoint
{
    // The application already holds an active grant here: revoke it first (design D-2).
    public const string AlreadyGranted = "application-already-granted";

    [WolverinePut("/api/organisations/{organisationId}/applications/{grantId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("grantApplication")]
    [PeopleOnly]
    [ProducesResponseType<GrantDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Put(
        Guid organisationId, Guid grantId, GrantApplication command, OrganisationContext context, OrganisationsDbContext db,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (GrantName.Check(command.Name) is { } rule)
        {
            errors["name"] = [rule];
        }

        if (command.ApplicationId is null || command.ApplicationId == Guid.Empty)
        {
            errors["applicationId"] = ["required"];
        }

        if (command.Tournaments is [])
        {
            errors["tournaments"] = ["required"];
        }

        if (command.Groups is null or [])
        {
            errors["groups"] = ["required"];
        }

        if (grantId == Guid.Empty)
        {
            errors["grantId"] = ["required"];
        }

        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var id = new GrantId(grantId);
        var name = GrantName.Create(command.Name);
        var owner = new PersonId(context.ActorId ?? throw new InvalidOperationException($"No acting person in organisation {organisationId}."));
        // The application is in the owner's directory: Herald's applications are provisioned there (docs/operations/identity.md).
        var directory = await db.Persons.AsNoTracking().Where(person => person.Id == owner)
            .Select(person => EF.Property<Guid>(person, nameof(IdentityKey.DirectoryId))).SingleAsync(cancellationToken);
        var application = new IdentityKey(directory, command.ApplicationId!.Value);
        if (await db.ApplicationGrants.SingleOrDefaultAsync(grant => grant.Id == id, cancellationToken) is { } existing)
        {
            return existing.Repeats(name, application, command.Tournaments, command.Groups!)
                ? await Granted(db, id, cancellationToken)
                : Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict");
        }

        if (await db.ApplicationGrants.AnyAsync(grant => grant.RevokedAt == null
                && EF.Property<Guid>(grant, nameof(IdentityKey.DirectoryId)) == application.DirectoryId
                && EF.Property<Guid>(grant, nameof(IdentityKey.ObjectId)) == application.ObjectId, cancellationToken))
        {
            return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", type: AlreadyGranted);
        }

        var granted = ApplicationGrant.Grant(id, name, application, command.Tournaments, command.Groups!, owner, DateTimeOffset.UtcNow);
        db.ApplicationGrants.Add(granted);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Another organisation's identifier, or a simultaneous grant: nothing about the holder is revealed.
            db.Entry(granted).State = EntityState.Detached;
            return Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict");
        }

        return await Granted(db, id, cancellationToken);
    }

    private static async Task<IResult> Granted(OrganisationsDbContext db, GrantId id, CancellationToken cancellationToken) =>
        Results.Ok((await GrantViews.ListAsync(db, id, cancellationToken)).Single());
}
