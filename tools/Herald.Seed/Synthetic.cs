using System.Security.Cryptography;
using System.Text;

namespace Herald.Seed;

// Deterministic identifiers: the same scenario on two fresh databases produces the same rows.
public static class Ids
{
    public static Guid For(params string[] parts)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('/', ["herald-seed", .. parts])));
        var bytes = hash.AsSpan(0, 16).ToArray();
        bytes[7] = (byte)((bytes[7] & 0x0F) | 0x80); // version 8: application-defined
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80); // RFC 9562 variant
        return new Guid(bytes);
    }
}

// Invented, game-agnostic names; never real people (ADR 0019).
public static class Names
{
    public static readonly string[] Players =
    [
        "Ada Fenwick", "Bram Holloway", "Cleo Marsh", "Dario Venn", "Edda Thorne", "Felix Arden",
        "Greta Lowe", "Hugo Pell", "Ines Carver", "Joss Mallory", "Kira Dunmore", "Lior Ashby",
        "Mara Quill", "Nils Brandt", "Odile Faure", "Piers Galloway",
    ];

    public static readonly string[] Teams = ["Copper Owls", "Lantern Foxes", "Granite Herons", "Saltmarsh Wolves"];
}

// Dates relative to the moment of seeding, in the tournament's time zone, on the hour.
public sealed class Clock(DateTimeOffset now, string timeZone = Clock.DefaultTimeZone)
{
    public const string DefaultTimeZone = "Europe/Madrid";

    private readonly DateTime _today = TimeZoneInfo.ConvertTime(now, TimeZoneInfo.FindSystemTimeZoneById(timeZone)).Date;

    public string TimeZone => timeZone;

    public string At(int days, int hour) => _today.AddDays(days).AddHours(hour).ToString("yyyy-MM-ddTHH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);
}
