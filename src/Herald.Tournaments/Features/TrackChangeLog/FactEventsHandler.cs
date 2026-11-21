using Herald.Contracts.Competition.V1;
using Herald.Contracts.Registration.V1;
using Herald.ModuleHosting;
using Herald.Tournaments.Domain;
using Herald.Tournaments.Persistence;
using Microsoft.EntityFrameworkCore;
using Wolverine.Attributes;

namespace Herald.Tournaments.Features.TrackChangeLog;

// Keeps other modules' facts in the tournament's change log, once each by subject and revision (h1-change-log D-3).
// Their reasons stay where they were given; the log links to them (Q1).
public static class FactEventsHandler
{
    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(EntryAdmitted message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        LogAsync(message.OrganisationId, context, db, new(
            new(message.TournamentId), ChangeKind.EntryAdmitted, message.EntryId, message.EntryRevision, message.AdmittedBy, message.AdmittedByName, message.AdmittedAt)
        {
            Alias = message.Alias,
            Cause = message.Cause,
        }, cancellationToken);

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(EntryCancelled message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        LogAsync(message.OrganisationId, context, db, new(
            new(message.TournamentId), ChangeKind.EntryCancelled, message.EntryId, message.EntryRevision, message.CancelledBy, message.CancelledByName, message.CancelledAt)
        {
            Alias = message.Alias,
            Cause = message.Cause,
        }, cancellationToken);

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(SchedulePublished message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        LogAsync(message.OrganisationId, context, db, new(
            new(message.TournamentId), ChangeKind.SchedulePublished, message.TournamentId, message.PublicationNumber, message.PublishedBy, message.PublishedByName,
            message.PublishedAt), cancellationToken);

    [RetryNow(typeof(DbUpdateException), 50, 100, 250)]
    public static Task Handle(ScheduleWithdrawn message, OrganisationContext context, TournamentsDbContext db, CancellationToken cancellationToken) =>
        LogAsync(message.OrganisationId, context, db, new(
            new(message.TournamentId), ChangeKind.ScheduleWithdrawn, message.TournamentId, message.PublicationNumber, message.WithdrawnBy, message.WithdrawnByName,
            message.WithdrawnAt)
        {
            Cause = message.Cause,
        }, cancellationToken);

    // The same fact delivered twice at once: the key rejects the second, whose retry then finds the first.
    private static async Task LogAsync(Guid organisationId, OrganisationContext context, TournamentsDbContext db, ChangeLogEntry entry, CancellationToken cancellationToken)
    {
        context.Enter(organisationId);
        if (await db.LogOnceAsync(entry, cancellationToken))
        {
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
