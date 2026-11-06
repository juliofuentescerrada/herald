using Shouldly;

namespace Herald.Architecture.Tests;

internal static class RuleResult
{
    public static void ShouldHaveNoFailingTypes(this NetArchTest.Rules.TestResult result) =>
        (result.FailingTypes ?? []).Select(type => $"{type.FullName}: {type.Explanation}").ShouldBeEmpty();
}
