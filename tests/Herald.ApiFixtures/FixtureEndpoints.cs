using Herald.ModuleHosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine.Http;

namespace Herald.ApiFixtures;

// Representative shapes for the generated client: a typed response with an optional field and a
// revision, a command whose answer is either applied (200) or only accepted (202), and the typed errors
// (not found, validation, permission, conflict).
public sealed record FixtureItem(Guid Id, string Name, string? Note, int Revision);

public sealed record ReviseFixtureItem(string Name, string? Note, int ExpectedRevision);

public sealed record FixtureItemRevised(Guid Id, int Revision);

// Accepted, not yet applied: the caller follows the operation; nothing about the item has changed yet.
public sealed record FixtureRevisionAccepted(Guid OperationId);

public static class GetFixtureItemEndpoint
{
    [WolverineGet("/api/fixtures/items/{itemId}")]
    [EndpointGroupName(HeraldApi.Public)]
    [EndpointName("getFixtureItem")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static FixtureItem Get(Guid itemId) => new(itemId, "Fixture item", null, 1);
}

public static class ReviseFixtureItemEndpoint
{
    [WolverinePut("/api/fixtures/items/{itemId}")]
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("reviseFixtureItem")]
    [ProducesResponseType<FixtureRevisionAccepted>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json")]
    public static FixtureItemRevised Put(Guid itemId, ReviseFixtureItem command) => new(itemId, command.ExpectedRevision + 1);
}
