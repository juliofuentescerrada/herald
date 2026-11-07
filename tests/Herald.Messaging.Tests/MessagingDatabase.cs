using Npgsql;
using Testcontainers.PostgreSql;

namespace Herald.Messaging.Tests;

// One PostgreSQL container for the run; each test gets a database of its own, so no envelope or row is shared.
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:18.3").Build();

    public async ValueTask InitializeAsync() => await _container.StartAsync();

    public async ValueTask DisposeAsync() => await _container.DisposeAsync();

    public async Task<string> CreateDatabaseAsync()
    {
        var name = $"messaging_{Guid.NewGuid():N}";
        await using (var server = new NpgsqlConnection(_container.GetConnectionString()))
        {
            await server.OpenAsync();
            await new NpgsqlCommand($"create database {name}", server).ExecuteNonQueryAsync();
        }

        var connectionString = new NpgsqlConnectionStringBuilder(_container.GetConnectionString()) { Database = name }.ConnectionString;
        // The probes have no migrations; their tables are created here.
        await using var database = new NpgsqlConnection(connectionString);
        await database.OpenAsync();
        await new NpgsqlCommand("""
            create schema probe_sender;
            create table probe_sender."Records" ("Id" uuid primary key);
            create schema probe_receiver;
            create table probe_receiver."Receipts" ("Id" uuid primary key, "RecordId" uuid not null);
            """, database).ExecuteNonQueryAsync();
        return connectionString;
    }
}

[CollectionDefinition(Name)]
public sealed class PostgresTests : ICollectionFixture<PostgresFixture>
{
    public const string Name = "PostgreSQL";
}

// Reads the test's database directly, to check where envelopes and rows ended up.
public sealed class MessagingDatabase(string connectionString)
{
    public string ConnectionString { get; } = connectionString;

    public async Task<long> CountAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        return (long)(await new NpgsqlCommand(sql, connection).ExecuteScalarAsync())!;
    }

    public async Task<string[]> ColumnAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var reader = await new NpgsqlCommand(sql, connection).ExecuteReaderAsync();
        var values = new List<string>();
        while (await reader.ReadAsync())
        {
            values.Add(reader.GetString(0));
        }

        return [.. values];
    }
}
