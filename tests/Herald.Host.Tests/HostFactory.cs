using JasperFx.CommandLine;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Wolverine;

namespace Herald.Host.Tests;

public sealed class HostFactory(string connectionString) : WebApplicationFactory<Program>
{
    // No broker in CI in M0: the transport is configured but never connects.
    private const string UnusedServiceBus = "Endpoint=sb://localhost;SharedAccessKeyName=unused;SharedAccessKey=unused";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // The host runs through RunJasperFxCommands, which otherwise leaves a factory-built host unstarted.
        JasperFxEnvironment.AutoStartHost = true;
        builder.UseSetting("ConnectionStrings:herald", connectionString);
        builder.UseSetting("ConnectionStrings:messaging", UnusedServiceBus);
        builder.ConfigureServices(services => services.DisableAllExternalWolverineTransports());
    }
}
