var builder = DistributedApplication.CreateBuilder(args);

var database = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("herald");

builder.AddProject<Projects.Herald_Host>("host")
    .WithReference(database)
    .WaitFor(database);

builder.Build().Run();
