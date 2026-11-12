using System.Reflection;
using System.Text.RegularExpressions;
using Herald.BuildingBlocks;
using Shouldly;

namespace Herald.Architecture.Tests;

// ADR 0017: every change that records an actor and a time, or keeps a history record, is in the inventory of
// notifiable facts, so publishing a fact later needs no data migration (harness-engineering D-6).
public partial class NotifiableFactsTests
{
    // Domain types that record an actor and a time but are not notifiable facts themselves, each with its reason.
    private static readonly Dictionary<string, string> _exemptions = new()
    {
        ["RosterMember"] = "Its addition is the roster change the inventory names as RosterChange.",
        ["Organisation"] = "Creating an organisation is not a notifiable fact in F-10.",
        ["Guest"] = "Creating a guest is not a notifiable fact in F-10.",
        ["CheckInChange"] = "Check-in is not a notifiable fact in F-10 (h1-check-in R-8).",
        ["Tournament"] = "Publication and registration opening or closing join the inventory when their owning change confirms what is recorded (ADR 0017).",
    };

    [Fact]
    [Trait("covers", "repository-rules: A new history record without an inventory row")]
    public void Every_domain_type_recording_an_actor_and_a_time_or_a_history_is_in_ADR_0017s_inventory()
    {
        var inventory = Inventory();
        var missing = Modules.Names
            .SelectMany(module => RecordingTypes(Modules.Load(module), $"Herald.{module}.Domain"))
            .Where(type => !inventory.Contains(type) && !_exemptions.ContainsKey(type))
            .ToList();

        missing.ShouldBeEmpty(
            "These domain types record an actor and a time, or a history, but ADR 0017's inventory of notifiable facts " +
            "does not name them: add a row to docs/adr/0017-notifications-consume-fact-events.md, or an exemption here with its reason.");
    }

    [Fact]
    public void Every_exemption_names_a_domain_type_that_still_exists()
    {
        var recording = Modules.Names.SelectMany(module => RecordingTypes(Modules.Load(module), $"Herald.{module}.Domain")).ToHashSet();
        _exemptions.Keys.Where(type => !recording.Contains(type)).ShouldBeEmpty("An exemption names a type that no longer records an actor and a time.");
    }

    // History records (a name ending in Change) and types with an actor and time pair (<X>By beside <X>At).
    private static IEnumerable<string> RecordingTypes(Assembly assembly, string domainNamespace) =>
        assembly.GetTypes()
            .Where(type => type.Namespace == domainNamespace && !type.IsEnum && !type.IsNested && !type.Name.Contains('<'))
            // Domain events carry an actor and a time too, but they are not persisted history (ADR 0006).
            .Where(type => !typeof(IDomainEvent).IsAssignableFrom(type))
            .Where(type => type.Name.EndsWith("Change", StringComparison.Ordinal) || HasActorAndTime(type))
            .Select(type => type.Name);

    private static bool HasActorAndTime(Type type)
    {
        var names = type.GetProperties(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance).Select(property => property.Name).ToHashSet();
        return names.Any(name => name.EndsWith("By", StringComparison.Ordinal) && names.Contains($"{name[..^2]}At"));
    }

    // The type names in backticks inside the inventory table of ADR 0017.
    private static HashSet<string> Inventory()
    {
        var adr = File.ReadAllText(Path.Combine(ProjectReferences.RepositoryRoot, "docs", "adr", "0017-notifications-consume-fact-events.md"));
        var start = adr.IndexOf("### Inventory of notifiable facts", StringComparison.Ordinal);
        start.ShouldBeGreaterThanOrEqualTo(0, "ADR 0017 has no inventory section.");
        var section = adr[start..];
        var end = section.IndexOf("\n#", 4, StringComparison.Ordinal);
        return [.. CodeSpan().Matches(end < 0 ? section : section[..end]).Select(match => match.Groups[1].Value)];
    }

    [GeneratedRegex("`([A-Z][A-Za-z]+)`")]
    private static partial Regex CodeSpan();
}
