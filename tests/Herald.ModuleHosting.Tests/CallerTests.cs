using System.Security.Claims;
using Shouldly;

namespace Herald.ModuleHosting.Tests;

public class CallerTests
{
    private static readonly Guid _directory = Guid.NewGuid();
    private static readonly Guid _object = Guid.NewGuid();

    private static Caller? From(params (string Type, string Value)[] extra) => Caller.From(new ClaimsPrincipal(new ClaimsIdentity(
        [new Claim("tid", _directory.ToString()), new Claim("oid", _object.ToString()), .. extra.Select(c => new Claim(c.Type, c.Value))], "test")));

    [Fact]
    public void A_token_with_the_organiser_role_is_a_person() =>
        From(("roles", HeraldAuthentication.OrganiserRole), ("scp", "access")).ShouldBe(new Caller(_directory, _object, CallerKind.Person));

    [Fact]
    public void A_token_with_the_pilot_role_and_no_delegated_scope_is_an_application() =>
        From(("roles", HeraldAuthentication.PilotApplicationRole)).ShouldBe(new Caller(_directory, _object, CallerKind.Application));

    [Fact]
    public void A_person_given_the_pilot_role_is_not_an_application() =>
        From(("roles", HeraldAuthentication.PilotApplicationRole), ("scp", "access")).ShouldBeNull();

    [Fact]
    public void A_token_without_a_role_of_Herald_is_no_caller() =>
        From(("roles", "Reader")).ShouldBeNull();
}
