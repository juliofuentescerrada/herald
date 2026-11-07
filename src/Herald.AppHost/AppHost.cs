var builder = DistributedApplication.CreateBuilder(args);

var database = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("herald");

// The only source of the broker topology: the host creates none. Topics and subscriptions,
// one topic per publishing module, are declared here with the first integration event (H1).
var messaging = builder.AddAzureServiceBus("messaging")
    .RunAsEmulator();

builder.AddProject<Projects.Herald_Host>("host")
    .WithReference(database)
    .WaitFor(database)
    .WithReference(messaging)
    .WaitFor(messaging);

builder.Build().Run();
