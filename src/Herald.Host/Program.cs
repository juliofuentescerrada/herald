using Herald.Competition;
using Herald.Organisations;
using Herald.Registration;
using Herald.ServiceDefaults;
using Herald.Standings;
using Herald.Tournaments;
using Wolverine;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.AddNpgsqlDataSource("herald");

builder.UseWolverine(options => options
    .AddOrganisationsModule()
    .AddTournamentsModule()
    .AddRegistrationModule()
    .AddCompetitionModule()
    .AddStandingsModule());

var app = builder.Build();

app.MapDefaultEndpoints();

app.Run();
