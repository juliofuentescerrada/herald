using Aspire.Hosting.JavaScript;

var builder = DistributedApplication.CreateBuilder(args);

var database = builder.AddPostgres("postgres")
    .WithDataVolume()
    .AddDatabase("herald");

// The only source of the broker topology: the host creates none. Topics and subscriptions,
// one topic per publishing module, are declared here with the first integration event (H1).
var messaging = builder.AddAzureServiceBus("messaging")
    .RunAsEmulator();

// Sign-in through the External ID directory shared with Arcana (ADR 0014). Not secrets, but they identify the
// maintainer's directory, so they live in user secrets: docs/operations/identity.md lists them and how to set them.
// auth-authority is https://<subdomain>.ciamlogin.com/<tenant-id>, with the tenant id and no trailing slash.
var authority = builder.AddParameter("auth-authority");
var apiAudience = builder.AddParameter("auth-api-audience");
var apiScope = builder.AddParameter("auth-api-scope");
var adminClientId = builder.AddParameter("auth-admin-client-id");

var host = builder.AddProject<Projects.Herald_Host>("host")
    // The API reads the v2.0 discovery document; MSAL takes the bare authority and finds it itself.
    .WithEnvironment("Herald__Authentication__Authority", ReferenceExpression.Create($"{authority}/v2.0"))
    .WithEnvironment("Herald__Authentication__Audience", apiAudience)
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
    .WithEnvironment("HERALD_AUTH_AUTHORITY", authority)
    .WithEnvironment("HERALD_AUTH_CLIENT_ID", adminClientId)
    .WithEnvironment("HERALD_AUTH_API_SCOPE", apiScope)
    .WaitFor(host);

// One install per workspace: two installers in the same folder race and the second app never starts.
var installer = admin.Resource.Annotations.OfType<JavaScriptPackageInstallerAnnotation>().Single().Resource;
var publicApp = builder.AddJavaScriptApp("public", "../../web", "start:public")
    .WithPnpm(install: false)
    .WithHttpEndpoint(port: 4300, env: "PORT")
    .WithEnvironment("HERALD_API_URL", apiUrl)
    .WaitFor(host)
    .WaitForCompletion(builder.CreateResourceBuilder(installer));

// Each links to the other: admin's "Back to public page", public's "Sign in" (D-10).
admin.WithEnvironment("HERALD_PUBLIC_URL", publicApp.GetEndpoint("http"));
publicApp.WithEnvironment("HERALD_ADMIN_URL", admin.GetEndpoint("http"));

builder.Build().Run();
