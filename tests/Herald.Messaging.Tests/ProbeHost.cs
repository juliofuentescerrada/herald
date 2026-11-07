using Herald.Messaging.Tests.Probes.Receiver;
using Herald.Messaging.Tests.Probes.Sender;
using Herald.ModuleHosting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using Wolverine;

namespace Herald.Messaging.Tests;

// Hosts the probe modules with the same module registration, messaging and API as Herald's host.
public static class ProbeHost
{
    public static async Task<WebApplication> StartAsync(string connectionString)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = Environments.Development });
        builder.WebHost.UseTestServer();
        builder.Logging.SetMinimumLevel(LogLevel.Warning);
        builder.Services.AddSingleton(_ => NpgsqlDataSource.Create(connectionString));
        builder.Services.AddHeraldApi();
        builder.UseWolverine(options => options
            .UseHeraldMessaging(createTablesOnStartup: true)
            .AddSenderProbe()
            .AddReceiverProbe());

        var app = builder.Build();
        app.MapHeraldApi();
        await app.StartAsync();
        return app;
    }
}
