using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.ModuleHosting;
using Shouldly;

namespace Herald.Host.Tests;

// operation-receipts: an operation identity on every mutation and the receipt it leaves (h1-api-journey D-1, D-2).
public partial class MatchTests
{
    private static async Task<HttpResponseMessage> WithOperationAsync(HttpClient client, HttpMethod method, string path, object? body, Guid operation)
    {
        using var request = new HttpRequestMessage(method, path) { Content = body is null ? null : JsonContent.Create(body) };
        request.Headers.Add(Receipts.Header, operation.ToString());
        return await client.SendAsync(request, Cancellation);
    }

    private static Task<HttpResponseMessage> ReceiptAsync(HttpClient client, League league, Guid operation) =>
        client.GetAsync($"{league.Organisation}/receipts/{operation}", Cancellation);

    private static async Task<string?> TypeAsync(HttpResponseMessage response) => (await JsonAsync(response)).GetProperty("type").GetString();

    [Fact]
    [Trait("covers", "operation-receipts: A lost response")]
    public async Task Repeating_an_entry_with_its_operation_identity_returns_the_first_response_and_admits_it_once()
    {
        var league = await OpenAsync("individual");
        var (guest, entry, operation) = (await GuestAsync(league, "Robin Vale", "player"), Guid.NewGuid(), Guid.NewGuid());
        var path = $"{league.Path}/entries/{entry}";

        var first = await SettledAsync(() => WithOperationAsync(league.Client, HttpMethod.Put, path, new { guestId = guest }, operation));
        await EnterAsync(league, "Sam Reed");
        var repeated = await WithOperationAsync(league.Client, HttpMethod.Put, path, new { guestId = guest }, operation);

        first.StatusCode.ShouldBe(HttpStatusCode.OK);
        repeated.StatusCode.ShouldBe(HttpStatusCode.OK);
        // The first response, from before Sam Reed's entry: the repeat had no second effect.
        (await repeated.Content.ReadAsStringAsync(Cancellation)).ShouldBe(await first.Content.ReadAsStringAsync(Cancellation));
        var field = await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries", Cancellation));
        field.GetProperty("entries").EnumerateArray().Count(e => e.GetProperty("guestName").GetString() == "Robin Vale").ShouldBe(1);
    }

    [Fact]
    [Trait("covers", "operation-receipts: A reused identity")]
    public async Task An_operation_identity_sent_again_with_another_result_is_rejected_as_reused_and_changes_nothing()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var match = MatchPath(league, matches[0]);
        var operation = Guid.NewGuid();
        (await SettledAsync(() => WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 1, outcome = "first" }, operation)))
            .StatusCode.ShouldBe(HttpStatusCode.OK);

        var reused = await WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 1, outcome = "second" }, operation);

        reused.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await TypeAsync(reused)).ShouldBe(Receipts.OperationReused);
        (await JsonAsync(await league.Client.GetAsync(match, Cancellation))).GetProperty("result").GetProperty("outcome").GetString().ShouldBe("first");
    }

    [Fact]
    [Trait("covers", "operation-receipts: Reconciling a result")]
    public async Task The_receipt_of_a_recorded_result_says_applied_with_the_match_and_its_revision()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var match = MatchPath(league, matches[0]);
        var operation = Guid.NewGuid();
        var recorded = await JsonAsync(await SettledAsync(() =>
            WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 1, outcome = "first" }, operation)));

        var receipt = await JsonAsync(await ReceiptAsync(league.Client, league, operation));

        receipt.GetProperty("operationId").GetGuid().ShouldBe(operation);
        receipt.GetProperty("operation").GetString().ShouldBe("recordResult");
        receipt.GetProperty("outcome").GetString().ShouldBe("applied");
        receipt.GetProperty("resource").GetString().ShouldBe($"{match}/result");
        receipt.GetProperty("revision").GetInt32().ShouldBe(Revision(recorded));
    }

    [Fact]
    [Trait("covers", "operation-receipts: Never arrived")]
    public async Task An_operation_the_host_never_received_reads_not_found_and_sending_it_applies_it_once()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var match = MatchPath(league, matches[0]);
        var operation = Guid.NewGuid();

        var unknown = await ReceiptAsync(league.Client, league, operation);
        var sent = await SettledAsync(() => WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 1, outcome = "first" }, operation));
        var again = await WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 1, outcome = "first" }, operation);

        unknown.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await TypeAsync(unknown)).ShouldBe(Receipts.NotFound);
        sent.StatusCode.ShouldBe(HttpStatusCode.OK);
        again.StatusCode.ShouldBe(HttpStatusCode.OK);
        (await JsonAsync(await ReceiptAsync(league.Client, league, operation))).GetProperty("outcome").GetString().ShouldBe("applied");
        (await JsonAsync(await league.Client.GetAsync(match, Cancellation))).GetProperty("revision").GetInt32().ShouldBe(Revision(await JsonAsync(sent)));
    }

    [Fact]
    [Trait("covers", "operation-receipts: Another organisation")]
    public async Task Another_organisations_receipt_is_the_generic_denial_and_absent_from_ones_own_organisation()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var operation = Guid.NewGuid();
        await SettledAsync(() => WithOperationAsync(league.Client, HttpMethod.Post, $"{MatchPath(league, matches[0])}/result", new { expectedRevision = 1, outcome = "first" }, operation));
        var other = await OpenAsync("individual");

        var denied = await ReceiptAsync(other.Client, league, operation);
        var absent = await ReceiptAsync(other.Client, other, operation);

        denied.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await TypeAsync(denied)).ShouldBe(HeraldApi.OrganisationNotAvailable);
        absent.StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await TypeAsync(absent)).ShouldBe(Receipts.NotFound);
    }

    [Fact]
    public async Task A_rejected_operation_keeps_its_problem_type_and_a_repeat_answers_it_again()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var match = MatchPath(league, matches[0]);
        var operation = Guid.NewGuid();

        var stale = await WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 9, outcome = "first" }, operation);
        var repeated = await WithOperationAsync(league.Client, HttpMethod.Post, $"{match}/result", new { expectedRevision = 9, outcome = "first" }, operation);

        stale.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        repeated.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        var receipt = await JsonAsync(await ReceiptAsync(league.Client, league, operation));
        receipt.GetProperty("outcome").GetString().ShouldBe("rejected");
        receipt.GetProperty("problemType").GetString().ShouldBe(await TypeAsync(stale));
    }

    [Fact]
    public async Task A_header_that_differs_from_the_operation_identity_in_the_body_is_refused()
    {
        var (league, matches) = await LeagueOfFourAsync();

        var refused = await WithOperationAsync(
            league.Client, HttpMethod.Post, $"{MatchPath(league, matches[0])}/result", new { operationId = Guid.NewGuid(), expectedRevision = 1, outcome = "first" }, Guid.NewGuid());

        refused.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        Errors(await JsonAsync(refused), Receipts.Header).ShouldBe(["matchesOperationId"]);
    }

    [Fact]
    public async Task Deleting_a_draft_removes_its_receipts_and_keeps_the_deletions_own()
    {
        var client = api.As(Guid.NewGuid());
        var organisation = Guid.NewGuid();
        (await client.CreateAsync(organisation, "Northside Gaming")).StatusCode.ShouldBe(HttpStatusCode.Created);
        var league = new League(client, $"/api/organisations/{organisation}", "");
        var (tournament, created, deleted) = (Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        (await WithOperationAsync(client, HttpMethod.Post, $"{league.Organisation}/tournaments", new { tournamentId = tournament, configuration = Configuration("individual") }, created))
            .StatusCode.ShouldBe(HttpStatusCode.Created);
        (await ReceiptAsync(client, league, created)).StatusCode.ShouldBe(HttpStatusCode.OK);

        var deletion = await WithOperationAsync(client, HttpMethod.Delete, $"{league.Organisation}/tournaments/{tournament}?expectedRevision=1", null, deleted);

        deletion.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await ReceiptAsync(client, league, created)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await WithOperationAsync(client, HttpMethod.Delete, $"{league.Organisation}/tournaments/{tournament}?expectedRevision=1", null, deleted))
            .StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task An_application_reads_the_receipts_of_its_own_operations_only()
    {
        var (league, matches) = await LeagueOfFourAsync();
        var bot = await GrantAsync(league, null, "read", "results");
        var (owners, bots) = (Guid.NewGuid(), Guid.NewGuid());
        await SettledAsync(() => WithOperationAsync(league.Client, HttpMethod.Post, $"{MatchPath(league, matches[0])}/result", new { expectedRevision = 1, outcome = "first" }, owners));
        await SettledAsync(() => WithOperationAsync(bot.Client, HttpMethod.Post, $"{MatchPath(league, matches[1])}/result", new { expectedRevision = 1, outcome = "first" }, bots));

        (await ReceiptAsync(bot.Client, league, bots)).StatusCode.ShouldBe(HttpStatusCode.OK);
        (await ReceiptAsync(bot.Client, league, owners)).StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await ReceiptAsync(league.Client, league, bots)).StatusCode.ShouldBe(HttpStatusCode.OK);
    }
    [Fact]
    public async Task Two_simultaneous_requests_with_one_identity_apply_once_and_answer_alike()
    {
        var league = await OpenAsync("individual");
        var (guest, entry, operation) = (await GuestAsync(league, "Robin Vale", "player"), Guid.NewGuid(), Guid.NewGuid());
        var path = $"{league.Path}/entries/{entry}";

        var answers = await SettledAsync(async () =>
        {
            var both = await Task.WhenAll(
                WithOperationAsync(league.Client, HttpMethod.Put, path, new { guestId = guest }, operation),
                WithOperationAsync(league.Client, HttpMethod.Put, path, new { guestId = guest }, operation));
            both.ShouldAllBe(response => response.StatusCode == HttpStatusCode.OK);
            (await both[1].Content.ReadAsStringAsync(Cancellation)).ShouldBe(await both[0].Content.ReadAsStringAsync(Cancellation));
            return both[0];
        });

        answers.StatusCode.ShouldBe(HttpStatusCode.OK);
        var field = await JsonAsync(await league.Client.GetAsync($"{league.Path}/entries", Cancellation));
        field.GetProperty("entries").GetArrayLength().ShouldBe(1);
    }

    [Fact]
    public async Task A_repeated_creation_answers_with_its_location_and_another_organisations_identity_reads_as_reused()
    {
        var league = await OpenAsync("individual");
        var (tournament, operation) = (Guid.NewGuid(), Guid.NewGuid());
        var body = new { tournamentId = tournament, configuration = Configuration("individual") };
        var created = await WithOperationAsync(league.Client, HttpMethod.Post, $"{league.Organisation}/tournaments", body, operation);

        var repeated = await WithOperationAsync(league.Client, HttpMethod.Post, $"{league.Organisation}/tournaments", body, operation);
        var other = await OpenAsync("individual");
        var elsewhere = await WithOperationAsync(other.Client, HttpMethod.Post, $"{other.Organisation}/tournaments", body, operation);

        created.StatusCode.ShouldBe(HttpStatusCode.Created);
        repeated.StatusCode.ShouldBe(HttpStatusCode.Created);
        repeated.Headers.Location.ShouldBe(created.Headers.Location);
        elsewhere.StatusCode.ShouldBe(HttpStatusCode.Conflict);
        (await TypeAsync(elsewhere)).ShouldBe(Receipts.OperationReused);
    }
}
