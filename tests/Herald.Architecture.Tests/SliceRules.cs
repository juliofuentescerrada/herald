using System.Reflection;
using System.Text.RegularExpressions;
using NetArchTest.Rules;
using TestResult = NetArchTest.Rules.TestResult;

namespace Herald.Architecture.Tests;

// The rules inside one module, given its root namespace, so real modules and fixtures run the same checks.
internal static class SliceRules
{
    public static TestResult DomainDependsOnlyOnTheBuildingBlocks(Assembly assembly, string root) =>
        Types.InAssembly(assembly)
            .That().ResideInNamespaceMatching(Within(root, "Domain"))
            .ShouldNot().HaveDependencyOtherThan("System", $"{root}.Domain", "Herald.BuildingBlocks")
            .GetResult();

    public static IEnumerable<TestResult> FeaturesAreIndependent(Assembly assembly, string root)
    {
        var features = FeaturesOf(assembly, root);
        foreach (var feature in features)
        {
            var others = features.Where(other => other != feature).Select(other => $"{root}.Features.{other}").ToArray();
            if (others.Length == 0)
            {
                continue;
            }

            yield return Types.InAssembly(assembly)
                .That().ResideInNamespaceMatching(Within(root, $"Features.{feature}"))
                .ShouldNot().HaveDependencyOnAny(others)
                .GetResult();
        }
    }

    public static TestResult PersistenceDoesNotDependOnFeatures(Assembly assembly, string root) =>
        Types.InAssembly(assembly)
            .That().ResideInNamespaceMatching(Within(root, "Persistence"))
            .ShouldNot().HaveDependencyOnAny($"{root}.Features")
            .GetResult();

    // A feature is the first namespace segment below Features; deeper namespaces belong to it.
    private static string[] FeaturesOf(Assembly assembly, string root) =>
        [.. assembly.GetTypes()
            .Select(type => type.Namespace ?? "")
            .Where(name => name.StartsWith($"{root}.Features.", StringComparison.Ordinal))
            .Select(name => name[$"{root}.Features.".Length..].Split('.')[0])
            .Distinct()];

    private static string Within(string root, string part) => $@"^{Regex.Escape($"{root}.{part}")}(\..+)?$";
}
