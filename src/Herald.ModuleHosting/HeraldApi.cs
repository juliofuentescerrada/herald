using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Wolverine.Http;

namespace Herald.ModuleHosting;

// The HTTP side every host of Herald modules shares: modules' Wolverine endpoints and their OpenAPI description.
public static class HeraldApi
{
    public static IServiceCollection AddHeraldApi(this IServiceCollection services) =>
        services.AddWolverineHttp().AddOpenApi();

    public static WebApplication MapHeraldApi(this WebApplication app)
    {
        app.MapWolverineEndpoints();
        // Development only for now, like /health: what Azure exposes is decided in M4.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        return app;
    }
}
