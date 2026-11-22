using Azure.Core;
using Azure.Identity;
using Npgsql;

namespace Herald.Host;

// How the host signs in to PostgreSQL (m4-cloud-runtime D-2): a password from the connection string, or, in a deployed slot,
// an Entra token for its managed identity, which is the database role Steward creates under the identity's name.
public static class DatabaseAuthentication
{
    public const string Password = "Password";
    public const string Entra = "Entra";
    public const string Scope = "https://ossrdbms-aad.database.windows.net/.default";

    // Entra tokens last about an hour: a fresh one well before that, and a quick retry when one fails.
    public static readonly TimeSpan Refresh = TimeSpan.FromMinutes(50);
    public static readonly TimeSpan RetryAfterFailure = TimeSpan.FromSeconds(10);

    public static void Configure(NpgsqlDataSourceBuilder dataSource, IConfiguration configuration, TokenCredential? credential = null)
    {
        var mode = configuration["Herald:Database:Authentication"] ?? Password;
        if (mode == Password)
        {
            return;
        }

        if (mode != Entra)
        {
            throw new InvalidOperationException($"Herald:Database:Authentication is '{mode}'; expected '{Password}' or '{Entra}'.");
        }

        credential ??= new ManagedIdentityCredential(ManagedIdentityId.FromUserAssignedClientId(configuration["Herald:Database:Identity"]
            ?? throw new InvalidOperationException("Entra database authentication needs Herald:Database:Identity, the managed identity's client id.")));
        dataSource.UsePeriodicPasswordProvider(
            async (_, cancellation) => (await credential.GetTokenAsync(new TokenRequestContext([Scope]), cancellation)).Token,
            Refresh,
            RetryAfterFailure);
    }
}
