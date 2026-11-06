using Herald.Competition.Adapters;
using Herald.Organisations.Adapters;
using Herald.Registration.Adapters;
using Herald.ServiceDefaults;
using Herald.Standings.Adapters;
using Herald.Tournaments.Adapters;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddNpgsqlDataSource("herald");

builder.Services
    .AddOrganisationsModule()
    .AddTournamentsModule()
    .AddRegistrationModule()
    .AddCompetitionModule()
    .AddStandingsModule();

var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();
