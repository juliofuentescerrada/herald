using Azure.Core;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Shouldly;

namespace Herald.Host.Tests;

[Collection(PostgresTests.Name)]
public class DatabaseAuthenticationTests(PostgresFixture postgres)
{
    [Fact]
    [Trait("covers", "cloud-runtime: Entra authentication configures a token instead of a password")]
    public async Task With_Entra_authentication_the_connection_signs_in_with_a_token_for_the_PostgreSQL_scope()
    {
        // The test server's password stands in for the token: signing in proves the token is the password.
        var withPassword = new NpgsqlConnectionStringBuilder(postgres.ConnectionString);
        var credential = new FakeCredential(withPassword.Password!);
        var dataSource = new NpgsqlDataSourceBuilder(new NpgsqlConnectionStringBuilder(postgres.ConnectionString) { Password = null }.ConnectionString);

        DatabaseAuthentication.Configure(dataSource, Settings(("Herald:Database:Authentication", "Entra"), ("Herald:Database:Identity", "unused")), credential);
        await using var built = dataSource.Build();
        await using var connection = await built.OpenConnectionAsync(TestContext.Current.CancellationToken);

        connection.State.ShouldBe(System.Data.ConnectionState.Open);
        credential.Scopes.ShouldAllBe(scopes => scopes.SequenceEqual(new[] { DatabaseAuthentication.Scope }));
        DatabaseAuthentication.Refresh.ShouldBeLessThan(TimeSpan.FromHours(1));
    }

    [Fact]
    public void Without_a_setting_the_connection_string_password_is_used()
    {
        var dataSource = new NpgsqlDataSourceBuilder(postgres.ConnectionString);
        var credential = new FakeCredential("unused");

        DatabaseAuthentication.Configure(dataSource, Settings(), credential);

        credential.Scopes.ShouldBeEmpty();
    }

    [Fact]
    public void Entra_authentication_without_an_identity_stops_the_host()
    {
        var dataSource = new NpgsqlDataSourceBuilder(postgres.ConnectionString);

        Should.Throw<InvalidOperationException>(() => DatabaseAuthentication.Configure(dataSource, Settings(("Herald:Database:Authentication", "Entra"))))
            .Message.ShouldContain("Herald:Database:Identity");
    }

    private static IConfiguration Settings(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values.Select(value => new KeyValuePair<string, string?>(value.Key, value.Value))).Build();

    private sealed class FakeCredential(string token) : TokenCredential
    {
        public List<string[]> Scopes { get; } = [];

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            Scopes.Add(requestContext.Scopes);
            return new AccessToken(token, DateTimeOffset.UtcNow.AddHours(1));
        }

        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            ValueTask.FromResult(GetToken(requestContext, cancellationToken));
    }
}
