using Herald.Competition;
using Herald.ModuleHosting;
using Herald.Organisations;
using Herald.Registration;
using Herald.ServiceDefaults;
using Herald.Standings;
using Herald.Tournaments;
using JasperFx;
using Wolverine;
using Wolverine.AzureServiceBus;
using Wolverine.Http;

var builder = WebApplication.CreateBuilder(args);

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

    // The AppHost declares the topology; Herald's host creates no topics, subscriptions or queues.
    options.UseAzureServiceBus(builder.Configuration.GetConnectionString("messaging")
            ?? throw new InvalidOperationException("The 'messaging' connection string is missing."))
        .SystemQueuesAreEnabled(false);

    options
        .AddOrganisationsModule()
        .AddTournamentsModule()
        .AddRegistrationModule()
        .AddCompetitionModule()
        .AddStandingsModule();
});
builder.Services.AddWolverineHttp();

var app = builder.Build();

app.MapDefaultEndpoints();
app.MapWolverineEndpoints();

return await app.RunJasperFxCommands(args);
