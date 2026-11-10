using System.Net.Http.Headers;
using System.Net.Http.Json;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Herald.Host.Tests;

// One database and one host for the organisation API tests; each test uses fresh identities and ids.
public sealed class OrganisationApi : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18.3").Build();
    private HostFactory? _host;

    public async ValueTask InitializeAsync()
    {
        await _container.StartAsync();
        _host = new HostFactory(_container.GetConnectionString());
        _ = _host.Server;
    }

    public async ValueTask DisposeAsync()
    {
        if (_host is not null)
        {
            await _host.DisposeAsync();
        }

        await _container.DisposeAsync();
    }

    public HttpClient Anonymous() => _host!.CreateClient();

    public HttpClient As(Guid objectId, string name = "Alex Morgan", bool organiser = true)
    {
        var client = _host!.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", TestTokens.For(objectId, name, organiser));
        return client;
    }

    public async Task ExecuteAsync(string sql, Guid parameter)
    {
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection) { Parameters = { new NpgsqlParameter { Value = parameter } } };
        await command.ExecuteNonQueryAsync();
    }

    public async Task<long> CountAsync(string sql, Guid parameter)
    {
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection) { Parameters = { new NpgsqlParameter { Value = parameter } } };
        return (long)(await command.ExecuteScalarAsync())!;
    }
}

[CollectionDefinition(Name)]
public sealed class OrganisationApiTests : ICollectionFixture<OrganisationApi>
{
    public const string Name = "Organisation API";
}

public static class OrganisationRequests
{
    public static Task<HttpResponseMessage> CreateAsync(this HttpClient client, Guid id, string name) =>
        client.PostAsJsonAsync("/api/organisations", new { organisationId = id, name }, TestContext.Current.CancellationToken);
}
