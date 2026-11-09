using JasperFx.CommandLine;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Wolverine;

namespace Herald.Host.Tests;

public sealed class HostFactory(string connectionString, string environment = "Development") : WebApplicationFactory<Program>
{
    // No broker in CI in M0: the transport is configured but never connects.
    private const string UnusedServiceBus = "Endpoint=sb://localhost;SharedAccessKeyName=unused;SharedAccessKey=unused";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // The host runs through RunJasperFxCommands, which otherwise leaves a factory-built host unstarted.
        JasperFxEnvironment.AutoStartHost = true;
        builder.UseEnvironment(environment);
        builder.UseSetting("ConnectionStrings:herald", connectionString);
        // Outside Development the tables are a deployment step; the test sets them up like Development does.
        builder.UseSetting("Herald:Database:SetUpOnStartup", "true");
        builder.UseSetting("ConnectionStrings:messaging", UnusedServiceBus);
        builder.UseSetting("Herald:Authentication:Authority", TestTokens.Issuer);
        builder.UseSetting("Herald:Authentication:Audience", TestTokens.Audience);
        builder.ConfigureServices(services =>
        {
            services.DisableAllExternalWolverineTransports();
            // The test key instead of the directory's metadata: nothing is fetched.
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.Configuration = new OpenIdConnectConfiguration { Issuer = TestTokens.Issuer };
                options.Configuration.SigningKeys.Add(TestTokens.SigningKey);
            });
        });
    }
}
