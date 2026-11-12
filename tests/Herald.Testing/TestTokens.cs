using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Herald.ModuleHosting;
using Microsoft.IdentityModel.Tokens;

namespace Herald.Testing;

// Tokens shaped like the directory's, signed with a key only the tests know: no test reaches the directory.
public static class TestTokens
{
    public const string Issuer = "https://directory.test/v2.0";
    public const string Audience = "herald-api-test";
    public static readonly Guid DirectoryId = Guid.Parse("00000000-0000-0000-0000-00000000d1ec");

    public static readonly SecurityKey SigningKey = new RsaSecurityKey(RSA.Create(2048)) { KeyId = "test" };

    public static string For(Guid objectId, string name = "Alex Morgan", bool organiser = true, Guid? directoryId = null) =>
        WithIdentifiers((directoryId ?? DirectoryId).ToString(), objectId.ToString(), name, organiser);

    // Any `tid` and `oid` text, for tokens the directory would never issue.
    public static string WithIdentifiers(string directoryId, string objectId, string name = "Alex Morgan", bool organiser = true)
    {
        var claims = new List<Claim>
        {
            new("tid", directoryId),
            new("oid", objectId),
            new("name", name),
        };
        if (organiser)
        {
            claims.Add(new Claim("roles", HeraldAuthentication.OrganiserRole));
        }

        var token = new JwtSecurityToken(Issuer, Audience, claims, DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow.AddMinutes(10),
            new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
