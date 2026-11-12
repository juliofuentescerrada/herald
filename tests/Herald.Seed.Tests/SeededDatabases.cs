using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Seed;
using Herald.Testing;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Herald.Seed.Tests;

// One PostgreSQL server; each test seeds databases of its own.
public sealed class SeededDatabases : IAsyncLifetime
{
    public static readonly DateTimeOffset Now = new(2026, 11, 12, 10, 0, 0, TimeSpan.Zero);

    public static readonly IReadOnlyDictionary<string, Persona> Personas = new Dictionary<string, Persona>
    {
        [Seed.Personas.Main] = new(Seed.Personas.Main, Guid.Parse("0198f5ee-0000-7000-8000-0000000000d1"), Guid.Parse("0198f5ee-0000-7000-8000-00000000a001"), "Avery Quinn"),
        [Seed.Personas.Rival] = new(Seed.Personas.Rival, Guid.Parse("0198f5ee-0000-7000-8000-0000000000d1"), Guid.Parse("0198f5ee-0000-7000-8000-00000000a002"), "Rowan Ellis"),
    };

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18.3").Build();

    public async ValueTask InitializeAsync()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_TEST_CONTENTROOT_HERALD_HOST", AppContext.BaseDirectory);
        await _container.StartAsync();
    }

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();

    // A new, empty database on the shared server.
    public async Task<string> NewDatabaseAsync()
    {
        var name = $"herald_{Guid.NewGuid():N}";
        await using (var connection = new NpgsqlConnection(_container.GetConnectionString()))
        {
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"CREATE DATABASE {name}", connection);
            await command.ExecuteNonQueryAsync();
        }

        return new NpgsqlConnectionStringBuilder(_container.GetConnectionString()) { Database = name }.ConnectionString;
    }

    public static Task<IReadOnlyList<ScenarioResult>> SeedAsync(string connectionString) => Seeder.RunAsync(connectionString, Personas, Now);

    public static async Task<long> CountAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return Convert.ToInt64(await command.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture);
    }

    public static async Task<IReadOnlyList<string>> ColumnAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var values = new List<string>();
        while (await reader.ReadAsync())
        {
            values.Add(reader.GetValue(0).ToString()!);
        }

        return values;
    }
}

// Reads the seeded data through the API as a persona would after signing in.
public sealed class Reader(string connectionString) : IAsyncDisposable
{
    private readonly HostFactory _host = new(connectionString);

    public async Task<JsonElement> GetAsync(Persona persona, string path)
    {
        using var client = _host.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", TestTokens.WithIdentifiers(persona.DirectoryId.ToString(), persona.ObjectId.ToString(), persona.Name));
        using var response = await client.GetAsync(path, TestContext.Current.CancellationToken);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken)
            : JsonSerializer.SerializeToElement(new { status = (int)response.StatusCode });
    }

    public async ValueTask DisposeAsync() => await _host.DisposeAsync();
}

[CollectionDefinition(Name)]
public sealed class SeededDatabasesTests : ICollectionFixture<SeededDatabases>
{
    public const string Name = "Seeded databases";
}
