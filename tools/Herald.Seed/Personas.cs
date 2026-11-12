using Microsoft.Extensions.Configuration;

namespace Herald.Seed;

// An identity the seeded data belongs to: the directory and object identifiers a sign-in would carry (D-21).
public sealed record Persona(string Key, Guid DirectoryId, Guid ObjectId, string Name);

public static class Personas
{
    public const string Main = "Main";
    public const string Rival = "Rival";

    // The rival's fixed test identity when none is configured: nobody signs in as it, it owns the isolation scenario.
    private static readonly Persona _defaultRival = new(Rival, Guid.Parse("00000000-0000-0000-0000-00000000d1ec"), Guid.Parse("0198f5ee-0000-7000-8000-00000000a002"), "Rowan Ellis");

    // Herald:Seed:Personas:<key>:DirectoryId, :ObjectId and :Name. Null when the main persona is not configured.
    public static IReadOnlyDictionary<string, Persona>? From(IConfiguration configuration)
    {
        var main = Read(configuration, Main, "Avery Quinn");
        if (main is null)
        {
            return null;
        }

        return new Dictionary<string, Persona> { [Main] = main, [Rival] = Read(configuration, Rival, _defaultRival.Name) ?? _defaultRival };
    }

    private static Persona? Read(IConfiguration configuration, string key, string defaultName)
    {
        var section = configuration.GetSection($"Herald:Seed:Personas:{key}");
        return Guid.TryParse(section["DirectoryId"], out var directory) && Guid.TryParse(section["ObjectId"], out var objectId)
            ? new Persona(key, directory, objectId, string.IsNullOrWhiteSpace(section["Name"]) ? defaultName : section["Name"]!)
            : null;
    }
}
