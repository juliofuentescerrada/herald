using System.Globalization;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Herald.ModuleHosting;

// The business errors an endpoint answers with one status, as problem types (API-01, API-07); the OpenAPI documents list them per
// response as `x-problem-types`, with those every organisation-scoped endpoint shares.
[AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
public sealed class ProblemTypesAttribute(int status, params string[] types) : Attribute
{
    public int Status { get; } = status;

    public IReadOnlyList<string> Types { get; } = types;
}

internal sealed class ProblemTypesTransformer : IOpenApiOperationTransformer
{
    public const string Extension = "x-problem-types";

    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var description = context.Description;
        var scoped = description.RelativePath?.StartsWith("api/organisations/{organisationId}", StringComparison.Ordinal) == true;
        var mutation = description.HttpMethod is { } method && !HttpMethods.IsGet(method);
        var declared = description.ActionDescriptor.EndpointMetadata.OfType<ProblemTypesAttribute>().ToList();
        foreach (var (code, response) in operation.Responses ?? [])
        {
            var status = int.Parse(code, CultureInfo.InvariantCulture);
            List<string> types = [.. declared.Where(d => d.Status == status).SelectMany(d => d.Types)];
            types.AddRange(status switch
            {
                StatusCodes.Status403Forbidden => [HeraldApi.OperationNotGranted],
                StatusCodes.Status404NotFound when scoped => [HeraldApi.OrganisationNotAvailable],
                StatusCodes.Status409Conflict when scoped && mutation => [Receipts.OperationReused],
                _ => [],
            });
            if (types.Count > 0 && response is OpenApiResponse concrete)
            {
                concrete.Extensions ??= new Dictionary<string, IOpenApiExtension>();
                concrete.Extensions[Extension] = new JsonNodeExtension(new JsonArray([.. types.Distinct().Select(type => JsonValue.Create(type))]));
            }
        }

        return Task.CompletedTask;
    }
}
