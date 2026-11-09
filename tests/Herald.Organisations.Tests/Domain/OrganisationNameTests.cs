using Herald.Organisations.Domain;
using Shouldly;

namespace Herald.Organisations.Tests.Domain;

public class OrganisationNameTests
{
    [Fact]
    public void A_name_is_trimmed() => OrganisationName.Create("  Southside Club ").Value.ShouldBe("Southside Club");

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_blank_name_breaks_the_required_rule(string? raw)
    {
        OrganisationName.Check(raw).ShouldBe("required");
        Should.Throw<ArgumentException>(() => OrganisationName.Create(raw));
    }

    [Fact]
    public void Eighty_characters_after_trimming_are_accepted() =>
        OrganisationName.Check($" {new string('a', 80)} ").ShouldBeNull();

    [Fact]
    public void Eighty_one_characters_break_the_length_rule() =>
        OrganisationName.Check(new string('a', 81)).ShouldBe("too-long");

    [Fact]
    public void The_length_counts_UTF16_units_as_the_browser_does() =>
        OrganisationName.Check(string.Concat(Enumerable.Repeat("🏆", 41))).ShouldBe("too-long");

    [Fact]
    public void Names_need_not_be_unique() =>
        OrganisationName.Create("Southside Club").ShouldBe(OrganisationName.Create("Southside Club"));
}
