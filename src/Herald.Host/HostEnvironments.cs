using System.Net.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Herald.Host;

public static class HostEnvironments
{
    // The end-to-end suite's environment: never a deployment (ADR 0015).
    public const string EndToEnd = "E2E";

    // Set by Azure hosting; their presence means a deployment, where E2E must never run.
    private static readonly string[] _hostingMarkers = ["CONTAINER_APP_NAME", "WEBSITE_SITE_NAME"];

    public static void RefuseEndToEndWhenHosted(IConfiguration configuration)
    {
        var marker = _hostingMarkers.FirstOrDefault(name => !string.IsNullOrEmpty(configuration[name]));
        if (marker is not null)
        {
            throw new InvalidOperationException($"The {EndToEnd} environment is for the end-to-end suite only, and '{marker}' says this is a deployment.");
        }
    }

    // The suite's identity provider serves TLS with a certificate it generates; only E2E accepts it.
    public static void TrustTheTestProvidersCertificate(IServiceCollection services) =>
        services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
            });
}
