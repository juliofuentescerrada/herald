using Herald.Competition.Domain;
using Shouldly;

namespace Herald.Competition.Tests.Domain;

public class RoundRobinTests
{
    private static List<Guid> Entrants(int count) => [.. Enumerable.Range(0, count).Select(_ => Guid.NewGuid())];

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    [InlineData(7)]
    [InlineData(8)]
    [InlineData(9)]
    public void Every_pair_meets_exactly_once_and_no_entrant_plays_twice_in_a_round(int count)
    {
        var entrants = Entrants(count);

        (var matches, var rests) = RoundRobin.Pair(entrants);

        matches.Count.ShouldBe(count * (count - 1) / 2);
        matches.Select(match => string.Join('|', new[] { match.First, match.Second }.Order())).Distinct().Count().ShouldBe(matches.Count);
        matches.ShouldAllBe(match => match.First != match.Second);
        var rounds = count % 2 == 0 ? count - 1 : count;
        foreach (var round in Enumerable.Range(1, rounds))
        {
            var playing = matches.Where(match => match.Round == round).SelectMany(match => new[] { match.First, match.Second })
                .Concat(rests.Where(rest => rest.Round == round).Select(rest => rest.EntryId)).ToList();
            playing.Count.ShouldBe(count);
            playing.Distinct().Count().ShouldBe(count);
        }
    }

    [Theory]
    [InlineData(3)]
    [InlineData(5)]
    [InlineData(9)]
    public void With_an_odd_field_each_entrant_rests_exactly_once(int count)
    {
        var entrants = Entrants(count);

        (_, var rests) = RoundRobin.Pair(entrants);

        rests.Select(rest => rest.EntryId).Order().ShouldBe(entrants.Order());
        rests.Select(rest => rest.Round).Distinct().Count().ShouldBe(count);
    }

    [Fact]
    public void An_even_field_has_no_rest()
    {
        RoundRobin.Pair(Entrants(4)).Rests.ShouldBeEmpty();
    }

    [Fact]
    public void The_same_seed_gives_the_same_order()
    {
        var entrants = Entrants(8);

        RoundRobin.Shuffle(entrants, 48213).ShouldBe(RoundRobin.Shuffle(entrants, 48213));
        RoundRobin.Shuffle(entrants, 48213).Order().ShouldBe(entrants.Order());
    }

    [Fact]
    public void Different_seeds_give_different_orders()
    {
        var entrants = Entrants(8);

        RoundRobin.Shuffle(entrants, 1).ShouldNotBe(RoundRobin.Shuffle(entrants, 2));
    }
}
