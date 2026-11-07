// One violation per slice rule, each below a nested namespace so the rules are shown to cover them.
namespace Herald.Architecture.Tests.Fixtures.Violating.Domain.Scoring
{
    // Shouldly stands for any library outside the domain's permitted dependencies; it is not named in any rule.
    public static class UsesAnUnlistedLibrary
    {
        public static void Check(int value) => Shouldly.ShouldBeTestExtensions.ShouldBe(value, 1);
    }
}

namespace Herald.Architecture.Tests.Fixtures.Violating.Features.RecordScore.Nested
{
    public sealed class UsesAnotherFeature
    {
        public ReviewScores.Nested.ReviewedScore? Reviewed { get; init; }
    }
}

namespace Herald.Architecture.Tests.Fixtures.Violating.Features.ReviewScores.Nested
{
    public sealed record ReviewedScore(int Value);
}

namespace Herald.Architecture.Tests.Fixtures.Violating.Persistence.Stores
{
    public sealed class UsesAFeature
    {
        public Features.ReviewScores.Nested.ReviewedScore? Reviewed { get; init; }
    }
}
