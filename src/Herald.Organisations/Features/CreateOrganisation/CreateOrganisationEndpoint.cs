using System.Security.Claims;
using Herald.ModuleHosting;
using Herald.Organisations.Domain;
using Herald.Organisations.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Wolverine.Http;

namespace Herald.Organisations.Features.CreateOrganisation;

// The client generates the identifier and keeps it for retries of the same attempt (D-5).
public sealed record CreateOrganisation(Guid OrganisationId, string Name);

public sealed record CreatedOrganisation(Guid Id, string Name);

public static class CreateOrganisationEndpoint
{
    [WolverinePost("/api/organisations")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("createOrganisation")]
    [ProducesResponseType<CreatedOrganisation>(StatusCodes.Status201Created)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static async Task<IResult> Post(
        CreateOrganisation command, ClaimsPrincipal user, OrganisationsDbContext db, OrganisationContext context, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        if (command.OrganisationId == Guid.Empty)
        {
            errors["organisationId"] = ["required"];
        }

        if (OrganisationName.Check(command.Name) is { } rule)
        {
            errors["name"] = [rule];
        }

        if (errors.Count > 0)
        {
            return Results.ValidationProblem(errors);
        }

        var caller = Caller.From(user)!;
        var person = await db.Persons.Identified(caller).SingleOrDefaultAsync(cancellationToken);
        if (person is null)
        {
            person = Person.Register(new IdentityKey(caller.DirectoryId, caller.ObjectId), user.Identity?.Name);
            db.Persons.Add(person);
        }
        else
        {
            person.RefreshDisplayName(user.Identity?.Name);
        }

        var id = new OrganisationId(command.OrganisationId);
        var name = OrganisationName.Create(command.Name);
        // shortcut: two simultaneous first attempts with one id lose to the primary key with a 500; retries follow a lost response, so they do not overlap.
        if (await db.Organisations.SingleOrDefaultAsync(organisation => organisation.Id == id, cancellationToken) is { } existing)
        {
            // A conflict says nothing about the organisation that holds the identifier.
            return existing.Repeats(name, person.Id)
                ? Created(existing)
                : Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict");
        }

        // The owner membership is organisation-owned: creation acts for the new organisation.
        context.Enter(id.Value);
        var created = Organisation.Create(id, name, person.Id, DateTimeOffset.UtcNow);
        db.Organisations.Add(created);
        return Created(created);
    }

    private static IResult Created(Organisation organisation) => Results.Created(
        $"/api/organisations/{organisation.Id.Value}", new CreatedOrganisation(organisation.Id.Value, organisation.Name.Value));
}
