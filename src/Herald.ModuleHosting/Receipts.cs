using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using Herald.BuildingBlocks;
using JasperFx;
using JasperFx.CodeGeneration;
using JasperFx.CodeGeneration.Frames;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Wolverine.Http;

namespace Herald.ModuleHosting;

public enum ReceiptOutcome
{
    Applied,
    Rejected,

    // Reserved for asynchronous operations of later horizons; H1's effects complete within the request (Q1).
    Received,
}

// What an admin mutation with an operation identity did (API-08, design D-1), kept in the schema of the module that did it,
// in the transaction of its effect. The response is kept so a repeat answers as the first request did (A-1: no request body).
public sealed class Receipt
{
    public Guid OperationId { get; init; }

    public Guid? ActorId { get; init; }

    public required string Operation { get; init; }

    public required string ContentHash { get; init; }

    public ReceiptOutcome Outcome { get; init; }

    public int Status { get; init; }

    public string? Response { get; init; }

    public int? Revision { get; init; }

    public required string Resource { get; init; }

    public string? ProblemType { get; init; }

    // Deleting a draft removes its receipts (operation-receipts).
    public Guid? TournamentId { get; init; }

    public DateTimeOffset At { get; init; }
}

// The operation the current request carries, entered by the receipt step for the endpoint's postprocessor; one per scope.
public sealed class PendingOperation
{
    public Guid? OperationId { get; private set; }

    public string Operation { get; private set; } = "";

    public string ContentHash { get; private set; } = "";

    // The tournament a creation names in its body, which has no tournament in its route.
    public Guid? TournamentId { get; private set; }

    public void Enter(Guid operationId, string operation, string contentHash, Guid? tournamentId) =>
        (OperationId, Operation, ContentHash, TournamentId) = (operationId, operation, contentHash, tournamentId);
}

// A module's receipts, asked in turn by the receipt step and the receipt endpoint (design D-2).
public interface IReceiptSource
{
    Task<Receipt?> FindAsync(Guid operationId, CancellationToken cancellationToken);
}

internal sealed class ReceiptSource<TDbContext>(TDbContext db) : IReceiptSource
    where TDbContext : OrganisationScopedDbContext
{
    public Task<Receipt?> FindAsync(Guid operationId, CancellationToken cancellationToken) =>
        db.Set<Receipt>().AsNoTracking().SingleOrDefaultAsync(receipt => receipt.OperationId == operationId, cancellationToken);
}

public static class Receipts
{
    public const string Header = "Operation-Id";

    // The same operation identity with other content (API-04).
    public const string OperationReused = "operation-reused";

    // An operation identity without a receipt: nothing was applied (Q1).
    public const string NotFound = "not-found";

    // A mutation is an organisation-scoped admin request that changes state.
    internal static bool IsMutation(HttpContext http, string? group) =>
        group == HeraldApi.Admin && !HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method);

    // Before the endpoint (design D-1): a known identity answers with its receipt's response, or as reused with other content; an
    // unknown one is entered for the endpoint's postprocessor. Null to go on to the endpoint.
    internal static async Task<IResult?> BeforeAsync(HttpContext http, string operation)
    {
        var request = http.Request;
        request.EnableBuffering();
        using var body = new MemoryStream();
        await request.Body.CopyToAsync(body, http.RequestAborted);
        request.Body.Position = 0;
        var content = body.ToArray();

        Guid? fromHeader = null;
        if (request.Headers.TryGetValue(Header, out var header))
        {
            if (!Guid.TryParse(header, out var parsed) || parsed == Guid.Empty)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]> { [Header] = ["uuid"] });
            }

            fromHeader = parsed;
        }

        // Commands that carry one in their body keep it, and the header must match it (API-04).
        var fromBody = BodyGuid(content, "operationId");
        if (fromHeader is { } h && fromBody is { } b && h != b)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { [Header] = ["matchesOperationId"] });
        }

        if ((fromHeader ?? fromBody) is not { } operationId)
        {
            return null;
        }

        // shortcut: hashes the body's bytes, so the same content serialised in another order reads as reused; canonicalise if a client needs it.
        var hash = Convert.ToHexString(SHA256.HashData([.. System.Text.Encoding.UTF8.GetBytes($"{operation}\n{request.Path}{request.QueryString}\n"), .. content]));
        if (await FindAsync(http, operationId) is { } receipt)
        {
            return receipt.ContentHash == hash
                ? Replay(receipt)
                : Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", type: OperationReused,
                    detail: "This operation identity was used for another request.");
        }

        http.RequestServices.GetRequiredService<PendingOperation>().Enter(operationId, operation, hash, BodyGuid(content, "tournamentId"));
        return null;
    }

    // Two requests with one identity at once: the second loses to the receipt's key and its effect is rolled back with it.
    internal static async Task<IResult?> AfterFailureAsync(HttpContext http) =>
        http.RequestServices.GetRequiredService<PendingOperation>().OperationId is { } operationId
        && !http.Response.HasStarted
        && await FindAsync(http, operationId) is { } receipt
            ? Replay(receipt)
            : null;

    public static async Task<Receipt?> FindAsync(HttpContext http, Guid operationId)
    {
        foreach (var source in http.RequestServices.GetServices<IReceiptSource>())
        {
            if (await source.FindAsync(operationId, http.RequestAborted) is { } receipt)
            {
                return receipt;
            }
        }

        return null;
    }

    // A receipt as its caller reads it (API-08): what happened, without the response it repeats.
    public sealed record ReceiptView(
        Guid OperationId, string Operation, ReceiptOutcome Outcome, int? Revision, string Resource, string? ProblemType, DateTimeOffset At);

    // Not found means nothing was applied with this identity: the request may be sent again with it (Q1). An application reads only
    // the receipts of its own operations; a person reads the organisation's.
    [EndpointGroupName(HeraldApi.Admin)]
    [EndpointName("readReceipt")]
    [OperationGroup(OperationGroup.Read)]
    [ProducesResponseType<ReceiptView>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json")]
    public static async Task<IResult> ReadAsync(Guid operationId, HttpContext http)
    {
        var context = http.RequestServices.GetRequiredService<OrganisationContext>();
        return await FindAsync(http, operationId) is { } receipt && (context.Grant is null || receipt.ActorId == context.ActorId)
            ? Results.Ok(new ReceiptView(receipt.OperationId, receipt.Operation, receipt.Outcome, receipt.Revision, receipt.Resource, receipt.ProblemType, receipt.At))
            : Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found", type: NotFound,
                detail: "Nothing was applied with this operation identity; the request may be sent again with it.");
    }

    private static IResult Replay(Receipt receipt) => receipt.Response is { } response
        ? Results.Text(response, receipt.Status >= 400 ? "application/problem+json" : "application/json", statusCode: receipt.Status)
        : Results.StatusCode(receipt.Status);

    private static Guid? BodyGuid(byte[] content, string name)
    {
        try
        {
            using var json = JsonDocument.Parse(content);
            return json.RootElement.ValueKind == JsonValueKind.Object
                && json.RootElement.EnumerateObject().FirstOrDefault(p => p.NameEquals(name)) is { Value.ValueKind: JsonValueKind.String } property
                && property.Value.TryGetGuid(out var id) && id != Guid.Empty
                ? id
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // Called by the endpoint's generated code after the handler, before the transaction's last save (ReceiptPolicy).
    public static void Record<TDbContext>(IResult result, TDbContext db, HttpContext http)
        where TDbContext : OrganisationScopedDbContext
    {
        var pending = http.RequestServices.GetRequiredService<PendingOperation>();
        if (pending.OperationId is not { } operationId)
        {
            return;
        }

        var status = (result as IStatusCodeHttpResult)?.StatusCode ?? StatusCodes.Status200OK;
        var value = (result as IValueHttpResult)?.Value;
        var json = value is null
            ? null
            : JsonSerializer.Serialize(value, value.GetType(), http.RequestServices.GetRequiredService<IOptions<Microsoft.AspNetCore.Http.Json.JsonOptions>>().Value.SerializerOptions);
        var rejected = status >= 400;
        db.Set<Receipt>().Add(new Receipt
        {
            OperationId = operationId,
            ActorId = http.RequestServices.GetRequiredService<OrganisationContext>().ActorId,
            Operation = pending.Operation,
            ContentHash = pending.ContentHash,
            Outcome = rejected ? ReceiptOutcome.Rejected : ReceiptOutcome.Applied,
            Status = status,
            Response = json,
            Revision = rejected ? null : RevisionOf(json),
            Resource = (result.GetType().GetProperty("Location")?.GetValue(result) as string) ?? http.Request.Path.Value!,
            ProblemType = rejected ? (value as ProblemDetails)?.Type ?? "validation" : null,
            TournamentId = Guid.TryParse(http.GetRouteValue("tournamentId") as string, out var tournament) ? tournament : pending.TournamentId,
            At = DateTimeOffset.UtcNow,
        });
    }

    private static int? RevisionOf(string? json)
    {
        if (json is null)
        {
            return null;
        }

        using var document = JsonDocument.Parse(json);
        return document.RootElement.ValueKind == JsonValueKind.Object
            && document.RootElement.TryGetProperty("revision", out var revision) && revision.TryGetInt32(out var number)
            ? number
            : null;
    }

    // Every module maps its receipts into its schema, organisation-owned and keyed by operation identity.
    public static void MapReceipts(this ModelBuilder modelBuilder)
    {
        var receipt = modelBuilder.Entity<Receipt>();
        receipt.HasKey(r => r.OperationId);
        receipt.Property(r => r.Outcome).HasConversion<string>();
        receipt.HasIndex(r => r.TournamentId);
    }
}

// Adds the receipt step to every organisation-scoped admin mutation whose handler writes through a module DbContext: after the
// handler and before the transaction's last save, so the receipt commits with the effect (design D-1).
internal sealed class ReceiptPolicy : IHttpPolicy
{
    private static readonly MethodInfo _record = typeof(Receipts).GetMethod(nameof(Receipts.Record))!;

    public void Apply(IReadOnlyList<HttpChain> chains, GenerationRules rules, IServiceContainer container)
    {
        foreach (var chain in chains.Where(c => c.HttpMethods.Any(m => m != HttpMethods.Get) && c.RoutePattern?.Parameters.Any(p => p.Name == "organisationId") == true))
        {
            if (chain.Method.Method.GetCustomAttribute<EndpointGroupNameAttribute>()?.EndpointGroupName != HeraldApi.Admin
                || chain.Method.Method.GetParameters().FirstOrDefault(p => p.ParameterType.IsSubclassOf(typeof(OrganisationScopedDbContext))) is not { } db
                || chain.Method.ReturnVariable?.VariableType is not { } returned
                || !(returned == typeof(Task<IResult>) || returned == typeof(IResult)))
            {
                continue;
            }

            chain.Postprocessors.Insert(0, new MethodCall(typeof(Receipts), _record.MakeGenericMethod(db.ParameterType)));
        }
    }
}
