using Aspire.Hosting.JavaScript;

var builder = DistributedApplication.CreateBuilder(args);

var database = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("herald");

// The only source of the broker topology: the host creates none. Topics and subscriptions,
// one topic per publishing module, are declared here with the first integration event (H1).
var messaging = builder.AddAzureServiceBus("messaging")
    .RunAsEmulator();

var host = builder.AddProject<Projects.Herald_Host>("host")
    .WithReference(database)
    .WaitFor(database)
    .WithReference(messaging)
    .WaitFor(messaging);

// Both web apps run `ng serve` from the one workspace (W-05). They call relative /api URLs:
// the dev server's proxy forwards them to the host, and public's SSR rewrites them to HERALD_API_URL.
var apiUrl = host.GetEndpoint("http");
var admin = builder.AddJavaScriptApp("admin", "../../web", "start:admin")
    .WithPnpm()
    .WithHttpEndpoint(port: 4200, env: "PORT")
    .WithEnvironment("HERALD_API_URL", apiUrl)
    .WaitFor(host);

// One install per workspace: two installers in the same folder race and the second app never starts.
var installer = admin.Resource.Annotations.OfType<JavaScriptPackageInstallerAnnotation>().Single().Resource;
builder.AddJavaScriptApp("public", "../../web", "start:public")
    .WithPnpm(install: false)
    .WithHttpEndpoint(port: 4300, env: "PORT")
    .WithEnvironment("HERALD_API_URL", apiUrl)
    .WaitFor(host)
    .WaitForCompletion(builder.CreateResourceBuilder(installer));

builder.Build().Run();
