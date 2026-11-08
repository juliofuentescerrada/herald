using Herald.ModuleHosting;
using JasperFx;
using Wolverine;

// Hosts only the fixture endpoints, through the same description pipeline as Herald's host.
// Export: dotnet run --project tests/Herald.ApiFixtures -- openapi -d public|admin -o <path>
var builder = WebApplication.CreateBuilder(args);
builder.UseWolverine(options => options.ApplicationAssembly = typeof(Program).Assembly);
builder.Services.AddHeraldApi();

var app = builder.Build();
app.MapHeraldApi();

return await app.RunJasperFxCommands(args);
