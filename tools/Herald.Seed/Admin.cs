using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Herald.Testing;

namespace Herald.Seed;

// The admin API as one persona sees it. Every write waits until the messages it caused have been handled.
public sealed class Admin(Seeding seeding, Persona persona)
{
    private readonly HttpClient _client = Client(seeding, persona);

    public Persona Persona => persona;

    public async Task<IReadOnlyList<Guid>> OwnedOrganisationsAsync()
    {
        var me = await ReadAsync(await _client.GetAsync("/api/me"), "read the signed-in person");
        return [.. me.GetProperty("organisations").EnumerateArray().Select(organisation => organisation.GetProperty("id").GetGuid())];
    }

    public Task CreateOrganisationAsync(Guid id, string name) =>
        WriteAsync($"create organisation '{name}'", () => _client.PostAsJsonAsync("/api/organisations", new { organisationId = id, name }));

    public Task CreateTournamentAsync(Guid organisation, Guid id, object configuration) =>
        WriteAsync($"create tournament {id}", () => _client.PostAsJsonAsync($"/api/organisations/{organisation}/tournaments", new { tournamentId = id, configuration }));

    public async Task PublishAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"publish tournament {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/publication", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task OpenRegistrationAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"open registration of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/registration/opening", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task CloseRegistrationAsync(Guid organisation, Guid tournament) =>
        await WriteAsync($"close registration of {tournament}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/registration/closure", new { expectedRevision = await RevisionAsync(organisation, tournament) }));

    public async Task<Guid> CreateGuestAsync(Guid organisation, string kind, string name)
    {
        var id = Ids.For(organisation.ToString(), kind, name);
        await WriteAsync($"create guest '{name}'", () =>
            _client.PutAsJsonAsync($"/api/organisations/{organisation}/guests/{id}", new { kind, name, confirmNew = true }));
        return id;
    }

    public async Task<Guid> EnterAsync(Guid organisation, Guid tournament, Guid guest)
    {
        var entry = Ids.For(tournament.ToString(), "entry", guest.ToString());
        await WriteAsync($"enter guest {guest}", () => _client.PutAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}", new { guestId = guest }));
        return entry;
    }

    public async Task CancelAsync(Guid organisation, Guid tournament, Guid entry) =>
        await WriteAsync($"cancel entry {entry}", async () =>
            await _client.PostAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}/cancellation", new { expectedRevision = await EntryRevisionAsync(organisation, tournament, entry) }));

    public async Task CheckInAsync(Guid organisation, Guid tournament, Guid entry) =>
        await WriteAsync($"check in entry {entry}", async () =>
            await _client.PutAsJsonAsync($"{Path(organisation, tournament)}/entries/{entry}/check-in", new { expectedRevision = await EntryRevisionAsync(organisation, tournament, entry, "checkInRevision") }));

    public async Task AddRosterMemberAsync(Guid organisation, Guid tournament, Guid entry, Guid player)
    {
        var roster = $"{Path(organisation, tournament)}/entries/{entry}/roster";
        await WriteAsync($"add player {player} to the roster of {entry}", async () =>
        {
            var revision = (await ReadAsync(await _client.GetAsync(roster), "read a roster")).GetProperty("revision").GetInt32();
            return await _client.PutAsJsonAsync($"{roster}/members/{player}", new { expectedRevision = revision });
        });
    }

    private static string Path(Guid organisation, Guid tournament) => $"/api/organisations/{organisation}/tournaments/{tournament}";

    private async Task<int> RevisionAsync(Guid organisation, Guid tournament) =>
        (await ReadAsync(await _client.GetAsync(Path(organisation, tournament)), "read a tournament")).GetProperty("revision").GetInt32();

    private async Task<int> EntryRevisionAsync(Guid organisation, Guid tournament, Guid entry, string revision = "revision") =>
        (await ReadAsync(await _client.GetAsync($"{Path(organisation, tournament)}/entries"), "read a field"))
            .GetProperty("entries").EnumerateArray().Single(candidate => candidate.GetProperty("id").GetGuid() == entry)
            .GetProperty(revision).GetInt32();

    private async Task WriteAsync(string step, Func<Task<HttpResponseMessage>> request)
    {
        using var response = await seeding.SettledAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new SeedStepException(step, response.StatusCode, await response.Content.ReadAsStringAsync());
        }
    }

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage response, string step)
    {
        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new SeedStepException(step, response.StatusCode, await response.Content.ReadAsStringAsync());
            }

            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }
    }

    private static HttpClient Client(Seeding seeding, Persona persona)
    {
        var client = seeding.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer", TestTokens.WithIdentifiers(persona.DirectoryId.ToString(), persona.ObjectId.ToString(), persona.Name));
        return client;
    }
}

public sealed class SeedStepException(string step, System.Net.HttpStatusCode status, string body)
    : Exception($"Could not {step}: {(int)status} {status}. {body}");
