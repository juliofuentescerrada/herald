using Herald.Contracts.Tournaments.V1;
using Herald.ModuleHosting;
using Herald.Registration.Domain;
using Herald.Registration.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine;
using Wolverine.Attributes;
using Contract = Herald.Contracts.Tournaments.V1;

namespace Herald.Registration.Features.TrackTournamentTerms;

// Keeps Registration's view of a tournament's entry terms (design D-3). Snapshots: older ones change nothing.
public static class TournamentEntryTermsChangedHandler
{
    // A write on the same field, or the first terms of a tournament arriving twice at once: tried again.
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static async Task Handle(
        TournamentEntryTermsChanged message, OrganisationContext context, RegistrationDbContext db, IMessageBus bus, CancellationToken cancellationToken)
    {
        context.Enter(message.OrganisationId);
        var id = new TournamentId(message.TournamentId);
        var terms = new EntryTerms(
            message.Registration switch
            {
                Contract.RegistrationState.Open => Domain.RegistrationState.Open,
                Contract.RegistrationState.Closed => Domain.RegistrationState.Closed,
                _ => Domain.RegistrationState.NotOpen,
            },
            message.Capacity,
            message.EntryKind == Contract.EntryKind.Team ? Domain.EntryKind.Team : Domain.EntryKind.Individual,
            message.Admission == Contract.Admission.Manual ? Domain.Admission.Manual : Domain.Admission.Automatic,
            message.MinimumRosterSize,
            message.MaximumRosterSize);
        var now = DateTimeOffset.UtcNow;

        if (await db.Fields.SingleOrDefaultAsync(field => field.Id == id, cancellationToken) is not { } field)
        {
            field = Field.Track(id, terms, message.Revision, now);
            db.Fields.Add(field);
        }
        else if (!field.ApplyTerms(terms, message.Revision, now))
        {
            return;
        }

        await bus.PublishAsync(Features.FieldDetails.Changed(message.OrganisationId, field));
    }
}
