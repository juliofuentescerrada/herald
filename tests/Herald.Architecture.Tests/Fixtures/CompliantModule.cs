using Herald.Architecture.Tests.Fixtures.Compliant.Domain;
using Herald.Architecture.Tests.Fixtures.Compliant.Persistence;

// A module shape every slice rule accepts: features use their own domain and persistence, nested namespaces included.
namespace Herald.Architecture.Tests.Fixtures.Compliant.Domain
{
    public sealed record Score(int Value)
    {
        public static Score Total(IEnumerable<Score> scores) => new(scores.Sum(score => score.Value));
    }
}

namespace Herald.Architecture.Tests.Fixtures.Compliant.Persistence
{
    public sealed class ScoreStore
    {
        public IList<Score> Scores { get; } = [];
    }
}

namespace Herald.Architecture.Tests.Fixtures.Compliant.Features.RecordScore
{
    public static class RecordScoreHandler
    {
        public static void Handle(Validation.RecordScoreRequest request, ScoreStore store) => store.Scores.Add(new Score(request.Value));
    }
}

namespace Herald.Architecture.Tests.Fixtures.Compliant.Features.RecordScore.Validation
{
    public sealed record RecordScoreRequest(int Value);
}

namespace Herald.Architecture.Tests.Fixtures.Compliant.Features.ReviewScores
{
    public static class ReviewScoresHandler
    {
        public static Score Handle(ScoreStore store) => Score.Total(store.Scores);
    }
}
