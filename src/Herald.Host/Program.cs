using Herald.Competition;
using Herald.Host;
using Herald.ModuleHosting;
using Herald.Organisations;
using Herald.Registration;
using Herald.ServiceDefaults;
using Herald.Standings;
using Herald.Tournaments;
using JasperFx;
using JasperFx.CodeGeneration;
using Wolverine;
using Wolverine.AzureServiceBus;

var builder = WebApplication.CreateBuilder(args);

// The end-to-end suite's environment (e2e-critical-paths): no Service Bus, a test identity provider.
var endToEnd = builder.Environment.IsEnvironment(HostEnvironments.EndToEnd);
if (endToEnd)
{
    HostEnvironments.RefuseEndToEndWhenHosted(builder.Configuration);
}

builder.AddServiceDefaults();
builder.AddNpgsqlDataSource("herald");

// Development only: elsewhere `db-apply` and the modules' migrations are deployment steps (m0-messaging design).
var setUpDatabaseOnStartup = builder.Configuration.GetValue<bool>("Herald:Database:SetUpOnStartup");
if (setUpDatabaseOnStartup)
{
    builder.Services.AddModuleMigrationsOnStartup();
}

builder.UseWolverine(options =>
{
    options.UseHeraldMessaging(setUpDatabaseOnStartup);

    // Generated at run time in Development and tests; elsewhere loaded from the code committed in
    // Internal/Generated (`dotnet run --project src/Herald.Host -- codegen write`), so nothing is compiled.
    options.ApplicationAssembly = typeof(Program).Assembly;
    options.CodeGeneration.TypeLoadMode = builder.Environment.IsDevelopment() ? TypeLoadMode.Dynamic : TypeLoadMode.Static;

    // The AppHost declares the topology; Herald's host creates no topics, subscriptions or queues.
    // The end-to-end suite runs without a broker: local queues and the PostgreSQL outbox still work.
    if (!endToEnd)
    {
        options.UseAzureServiceBus(builder.Configuration.GetConnectionString("messaging")
                ?? throw new InvalidOperationException("The 'messaging' connection string is missing."))
            .SystemQueuesAreEnabled(false);
    }

    options
        .AddOrganisationsModule()
        .AddTournamentsModule()
        .AddRegistrationModule()
        .AddCompetitionModule()
        .AddStandingsModule();
});
builder.Services.AddHeraldApi();
builder.Services.AddHeraldAuthentication(builder.Configuration);
if (endToEnd)
{
    HostEnvironments.TrustTheTestProvidersCertificate(builder.Services);
}

var app = builder.Build();

app.MapDefaultEndpoints();
app.MapHeraldApi();

return await app.RunJasperFxCommands(args);
