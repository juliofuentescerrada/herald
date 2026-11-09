using Herald.Organisations.Domain;
using Herald.Organisations.Features.RelinkPerson;
using Herald.Organisations.Persistence;
using JasperFx.CommandLine;

namespace Herald.Host;

public sealed class RelinkPersonInput : NetCoreInput
{
    [Description("The Herald person to relink")]
    public Guid PersonId { get; set; }

    [Description("The new identity's directory (tenant) id, `tid`")]
    public Guid DirectoryId { get; set; }

    [Description("The new identity's object id, `oid`")]
    public Guid ObjectId { get; set; }

    [Description("Why, including how ownership was verified")]
    public string ReasonFlag { get; set; } = "";

    [Description("Who runs the relink")]
    public string OperatorFlag { get; set; } = "";
}

// Support recovery (D-6, docs/operations/identity.md): run by the platform operator against the target database.
[Description("Relink a verified person to a new directory identity", Name = "relink-person")]
public sealed class RelinkPersonCommand : JasperFxAsyncCommand<RelinkPersonInput>
{
    public RelinkPersonCommand() => Usage("Relink").Arguments(x => x.PersonId, x => x.DirectoryId, x => x.ObjectId);

    public override async Task<bool> Execute(RelinkPersonInput input)
    {
        using var host = input.BuildHost();
        await using var scope = host.Services.CreateAsyncScope();
        var failure = await RelinkPerson.RunAsync(
            scope.ServiceProvider.GetRequiredService<OrganisationsDbContext>(), input.PersonId,
            new IdentityKey(input.DirectoryId, input.ObjectId), input.OperatorFlag, input.ReasonFlag, DateTimeOffset.UtcNow,
            CancellationToken.None);
        await Console.Error.WriteLineAsync(failure ?? $"Person {input.PersonId} relinked; the previous identity no longer signs in as them.");
        return failure is null;
    }
}
