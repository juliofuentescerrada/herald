using Shouldly;

namespace Herald.Architecture.Tests;

public class IsolationTests
{
    // Each entry is a reviewed reason to read across organisations (ADR 0014); add one only with its test.
    private static readonly string[] _allowedFilterBypasses = [];

    [Fact]
    public void Only_reviewed_code_bypasses_the_organisation_filter()
    {
        var src = Path.Combine(ProjectReferences.RepositoryRoot, "src");
        var bypasses = Directory.EnumerateFiles(src, "*.cs", SearchOption.AllDirectories)
            .Where(file => !file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}"))
            .Where(file => File.ReadAllText(file).Contains("IgnoreQueryFilters", StringComparison.Ordinal))
            .Select(file => Path.GetRelativePath(src, file).Replace('\\', '/'))
            .Order()
            .ToArray();

        bypasses.ShouldBe(_allowedFilterBypasses, customMessage: "Reading across organisations needs a reviewed reason: list the file here with the test that covers it.");
    }
}
