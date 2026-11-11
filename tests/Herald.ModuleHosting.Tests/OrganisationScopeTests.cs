using Microsoft.EntityFrameworkCore;
using Shouldly;

namespace Herald.ModuleHosting.Tests;

[Collection(PostgresTests.Name)]
public class OrganisationScopeTests(PostgresFixture postgres)
{
    private readonly Guid _northside = Guid.NewGuid();
    private readonly Guid _southside = Guid.NewGuid();

    [Fact]
    public async Task A_query_without_a_filter_sees_only_its_organisations_rows()
    {
        await AddNote(_northside, "Northside's note");
        await AddNote(_southside, "Southside's note");

        await using var database = postgres.Scope(_northside);
        var notes = await database.Notes.Select(note => note.Text).ToListAsync(TestContext.Current.CancellationToken);

        notes.ShouldBe(["Northside's note"]);
    }

    [Fact]
    public async Task A_new_row_belongs_to_the_current_organisation_without_the_handler_setting_it()
    {
        var note = await AddNote(_northside, "Stamped");

        await using var database = postgres.Scope(null);
        var owner = await database.Notes.IgnoreQueryFilters([OrganisationScopedDbContext.OrganisationFilter])
            .Where(row => row.Id == note.Id)
            .Select(row => EF.Property<Guid>(row, OrganisationScopedDbContext.OrganisationProperty))
            .SingleAsync(TestContext.Current.CancellationToken);

        owner.ShouldBe(_northside);
    }

    [Fact]
    public async Task Without_an_organisation_context_a_query_returns_no_rows()
    {
        await AddNote(_northside, "Hidden");

        await using var database = postgres.Scope(null);

        (await database.Notes.AnyAsync(TestContext.Current.CancellationToken)).ShouldBeFalse();
    }

    [Fact]
    public async Task Saving_an_organisation_owned_row_without_a_context_fails()
    {
        await using var database = postgres.Scope(null);
        database.Notes.Add(new ProbeNote { Text = "Orphan" });

        (await Should.ThrowAsync<InvalidOperationException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken)))
            .Message.ShouldContain("no organisation context");
    }

    [Fact]
    public async Task Changing_another_organisations_row_fails_even_when_it_was_loaded_past_the_filter()
    {
        var note = await AddNote(_southside, "Southside's");

        await using var database = postgres.Scope(_northside);
        var loaded = await database.Notes.IgnoreQueryFilters([OrganisationScopedDbContext.OrganisationFilter])
            .SingleAsync(row => row.Id == note.Id, TestContext.Current.CancellationToken);
        loaded.Text = "Overwritten by Northside";

        (await Should.ThrowAsync<InvalidOperationException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken)))
            .Message.ShouldContain("another organisation");
    }

    [Fact]
    public async Task A_new_row_cannot_be_given_to_another_organisation()
    {
        await using var database = postgres.Scope(_northside);
        var note = new ProbeNote { Text = "Planted" };
        database.Notes.Add(note);
        database.Entry(note).Property(OrganisationScopedDbContext.OrganisationProperty).CurrentValue = _southside;

        await Should.ThrowAsync<InvalidOperationException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public void A_scope_cannot_switch_to_another_organisation()
    {
        var context = new OrganisationContext();
        context.Enter(_northside);

        Should.Throw<InvalidOperationException>(() => context.Enter(_southside));
    }

    [Fact]
    public void A_scope_keeps_the_person_who_entered_it()
    {
        var actor = Guid.NewGuid();
        var context = new OrganisationContext();
        context.Enter(_northside, actor);
        context.Enter(_northside);

        context.ActorId.ShouldBe(actor);
    }

    private async Task<ProbeNote> AddNote(Guid organisationId, string text)
    {
        await using var database = postgres.Scope(organisationId);
        var note = new ProbeNote { Text = text };
        database.Notes.Add(note);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        return note;
    }
}
