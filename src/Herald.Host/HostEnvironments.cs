using System.Net.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Herald.Host;

public static class HostEnvironments
{
    // The end-to-end suite's environment: never a deployment (ADR 0015).
    public const string EndToEnd = "E2E";

    public static void RefuseEndToEndWhenHosted(IConfiguration configuration)
    {
        // A deployment is where E2E must never run.
        var marker = Herald.ServiceDefaults.ServiceDefaults.HostingMarker(configuration);
        if (marker is not null)
        {
            throw new InvalidOperationException($"The {EndToEnd} environment is for the end-to-end suite only, and '{marker}' says this is a deployment.");
        }
    }

    // The suite's identity provider serves TLS with a certificate it generates; only E2E accepts it.
    // Configure, not PostConfigure: JwtBearer builds its back channel from this handler in its own PostConfigure.
    public static void TrustTheTestProvidersCertificate(IServiceCollection services) =>
        services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            options.BackchannelHttpHandler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
            });
}
