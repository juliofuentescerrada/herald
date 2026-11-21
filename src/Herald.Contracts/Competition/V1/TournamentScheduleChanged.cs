namespace Herald.Contracts.Competition.V1;

public sealed record ScheduleEntrant(Guid EntryId, string Name);

public sealed record SchedulePairing(int Round, Guid First, Guid Second);

public sealed record ScheduleRest(int Round, Guid EntryId);

/// <summary>The published revision's pairings with the entrants' aliases, in the schedule's order (h1-public-read).</summary>
public sealed record PublishedSchedule(IReadOnlyList<ScheduleEntrant> Entrants, IReadOnlyList<SchedulePairing> Matches, IReadOnlyList<ScheduleRest> Rests);

/// <summary>
/// The state of a tournament's schedule, as a full snapshot: a consumer keeps the one with the highest
/// revision and ignores older ones (ADR 0016). While a revision is published, PublishedRevision names it,
/// EligibleRevision is the eligible field it was drafted from and Published holds its pairings; all are null otherwise.
/// Published is absent from messages sent before h1-public-read.
/// </summary>
public sealed record TournamentScheduleChanged(
    Guid OrganisationId,
    Guid TournamentId,
    int Revision,
    int? PublishedRevision,
    int? EligibleRevision,
    PublishedSchedule? Published = null);
