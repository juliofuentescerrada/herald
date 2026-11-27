using Herald.Seed;
using Microsoft.Extensions.Configuration;

// dotnet run --project tools/Herald.Seed [-- --environment <name>]
// Configuration: ConnectionStrings:herald, Herald:Seed:Personas:Main:DirectoryId/ObjectId[/Name] (and :Rival) and
// Herald:Seed:Reset=true to drop Herald's schemas first (the preview slot),
// from environment variables (ConnectionStrings__herald, Herald__Seed__Personas__Main__ObjectId, ...) or arguments.
var configuration = new ConfigurationBuilder().AddEnvironmentVariables().AddCommandLine(args).Build();

// The in-process host's own logs stay quiet; the seeding reports each scenario.
Environment.SetEnvironmentVariable("Logging__LogLevel__Default", "Warning");
Environment.SetEnvironmentVariable("Logging__LogLevel__Wolverine.Http.HttpGraph", "Error");
return await SeedCommand.RunAsync(configuration, Console.Out, Console.Error);
