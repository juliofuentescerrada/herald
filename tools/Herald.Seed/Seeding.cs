using Herald.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Wolverine;
using Wolverine.Tracking;

namespace Herald.Seed;

// Herald's host in this process against the target database. The tokens the seeding signs are valid here only.
public sealed class Seeding(string connectionString) : IAsyncDisposable
{
    private static readonly TimeSpan _settleTimeout = TimeSpan.FromSeconds(60);

    private readonly HostFactory _factory = Factory(connectionString);

    // Outside a solution build the factory cannot find the host's project folder; the host's settings files are
    // copied next to this tool, so its output folder is the content root.
    private static HostFactory Factory(string connectionString)
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_TEST_CONTENTROOT_HERALD_HOST", AppContext.BaseDirectory);
        return new HostFactory(connectionString);
    }

    public HttpClient CreateClient() => _factory.CreateClient();

    // Runs a request and waits until every message it causes has been handled, in every module (D-2).
    public async Task<HttpResponseMessage> SettledAsync(Func<Task<HttpResponseMessage>> request)
    {
        HttpResponseMessage? response = null;
        await _factory.Services.GetRequiredService<IHost>().TrackActivity(_settleTimeout)
            .ExecuteAndWaitAsync((Func<IMessageContext, Task>)(async _ => response = await request()));
        return response!;
    }

    public async ValueTask DisposeAsync() => await _factory.DisposeAsync();
}
