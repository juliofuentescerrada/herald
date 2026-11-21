import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeraldHostAdminService, HttpValidationProblemDetails, problemOf, ScheduleDetails, StandingsView, TournamentDetails } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, organisationKey, QUERY_CLIENT } from '../../platform';
import { instantText, TournamentNav } from '../../shared';
import { finaliseRuleText, lineText, pointsText, scheduleKey, standingsKey, tournamentKey } from './standings';

/**
 * A started tournament's standings, each entrant's points explained (F-09, h1-standings D-3, D-4), with the review barrier
 * before finalisation, the final revisions and reopening (h1-finalisation D-6).
 */
@Component({
  selector: 'app-standings-page',
  imports: [Button, Dialog, Icon, Notice, RouterLink, StatusLabel, TournamentNav],
  templateUrl: './standings-page.html',
  styleUrl: './standings-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly reopenDialog = viewChild.required<TemplateRef<DialogContext>>('reopenDialog');
  private openDialog: DialogRef | null = null;

  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  /** Started: running or finalised; standings exist from the start on. */
  protected readonly running = computed(() => {
    const t = this.tournament.data();
    // A tournament cancelled before start never ran.
    return !!t && t.competition !== 'preparation' && (t.competition !== 'cancelled' || t.start.startedAt != null);
  });
  /** Cancelled after start: the last results stay, with no champion and no final ranking (h1-tournament-cancel-and-dates D-2). */
  protected readonly cancelled = computed(() => this.tournament.data()?.competition === 'cancelled');
  /** Competition's own view of the matches and results revision: when it is ahead of the standings, they are updating. */
  protected readonly schedule = injectQuery(() => ({
    queryKey: scheduleKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getSchedule<ScheduleDetails>(this.organisation, this.tournamentId)),
    enabled: this.running(),
    retry: false,
  }));
  /** Set from updating, which reads the standings query: reading it in the query's own options would be a cycle. */
  private readonly polling = signal(false);
  protected readonly standings = injectQuery(() => ({
    queryKey: standingsKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getStandings<StandingsView>(this.organisation, this.tournamentId)),
    enabled: this.running(),
    retry: false,
    // Read again until the newer results have arrived.
    refetchInterval: this.polling() ? 1000 : false,
  }));

  /** Standings exist once the first results arrive, just after start: until then they are updating, not missing. */
  private readonly notYet = computed<boolean>(() => this.standings.error() instanceof HttpErrorResponse && (this.standings.error() as HttpErrorResponse).status === 404);
  protected readonly failed = computed<boolean>(() => this.standings.isError() && !this.notYet());
  protected readonly updating = computed<boolean>(() => {
    if (!this.running() || this.failed()) return false;
    if (this.notYet()) return true;
    return (this.schedule.data()?.resultsRevision ?? 0) > (this.standings.data()?.revision ?? 0);
  });
  protected readonly teams = computed(() => this.tournament.data()?.configuration.entryKind === 'team');
  protected readonly view = computed(() => this.standings.data() ?? null);
  /** Competition decides finalisation: its schedule says whether the competition is final and lists the final revisions. */
  protected readonly finalised = computed(() => this.schedule.data()?.finalised ?? false);
  protected readonly finals = computed(() => this.schedule.data()?.finals ?? []);
  /** Matches voided by the cancellation: resolved with no points, never played. */
  protected readonly voided = computed(() => this.schedule.data()?.matches.filter((match) => match.result?.cause === 'voidedCancelled').length ?? 0);
  protected readonly unresolved = computed(() => this.schedule.data()?.matches.filter((match) => match.state !== 'resolved') ?? []);
  protected readonly zone = computed(() => this.tournament.data()?.configuration.timeZone ?? 'UTC');
  protected readonly zoned = (instant: string | null | undefined) => (instant ? `${instantText(instant, this.zone())} · ${this.zone()}` : '');

  /** The finalisation or reopening in progress, the stale review's current revision, and a failure, each shown where it happened. */
  protected readonly busy = signal(false);
  protected readonly staleAt = signal<number | null>(null);
  protected readonly failure = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonError = signal<string | null>(null);

  /** The rows whose explanation is open, by entry. */
  protected readonly open = signal<ReadonlySet<string>>(new Set());

  protected readonly lineText = lineText;
  protected readonly pointsText = pointsText;

  constructor() {
    effect(() => this.polling.set(this.updating()));
  }

  /** Finalises at the standings revision the owner is reading; the panel offers it only when it equals the results revision (D-1). */
  protected async finalise(): Promise<void> {
    const schedule = this.schedule.data();
    const view = this.view();
    if (this.busy() || !schedule || !view) return;
    this.busy.set(true);
    this.failure.set(null);
    try {
      const answer = await firstValueFrom(
        this.api.finaliseCompetition<ScheduleDetails>(this.organisation, this.tournamentId, { reviewedRevision: view.revision, expectedRevision: schedule.revision }));
      this.applied(answer);
      this.toasts.show(`${this.tournament.data()!.configuration.title} finalised.`);
    } catch (error) {
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const problem = status === 400 ? problemOf<HttpValidationProblemDetails & { schedule?: ScheduleDetails }>(error) : null;
      if (problem?.errors?.['review']) {
        // A result, departure or correction arrived since the review: nothing was finalised (D-1).
        this.staleAt.set(problem.schedule?.resultsRevision ?? null);
        if (problem.schedule) this.queries.setQueryData(scheduleKey(this.organisation, this.tournamentId), problem.schedule);
        return;
      }
      const [field, rules] = Object.entries(problem?.errors ?? {})[0] ?? [];
      this.failure.set(status === 409 ? 'The competition changed elsewhere. Nothing was finalised. Review the latest standings and try again.'
        : field ? `${finaliseRuleText(field, rules[0])} Nothing was finalised.` : 'The request failed. Nothing was finalised. Try again.');
      void this.refresh();
    } finally {
      this.busy.set(false);
    }
  }

  /** Reads the latest standings and schedule again, for a renewed review. */
  protected async refresh(): Promise<void> {
    this.staleAt.set(null);
    await Promise.all([this.schedule.refetch(), this.standings.refetch()]);
  }

  protected askReopen(trigger: HTMLElement): void {
    this.reason.set('');
    this.reasonError.set(null);
    this.failure.set(null);
    const open = this.dialogs.open(this.reopenDialog(), { trigger, viewContainerRef: this.viewContainerRef });
    this.openDialog = open;
    void open.closed.then(() => {
      if (this.openDialog === open) this.openDialog = null;
    });
  }

  protected closeDialog(): void {
    this.openDialog?.close();
  }

  /** Returns the competition to running with a required, private reason; the final revision stays listed (D-3). */
  protected async reopen(): Promise<void> {
    const schedule = this.schedule.data();
    const reason = this.reason().trim();
    if (this.busy() || !schedule) return;
    if (!reason) {
      this.reasonError.set(finaliseRuleText('reason', 'required'));
      return;
    }
    this.busy.set(true);
    this.failure.set(null);
    try {
      const answer = await firstValueFrom(this.api.reopenCompetition<ScheduleDetails>(this.organisation, this.tournamentId, { reason, expectedRevision: schedule.revision }));
      this.applied(answer);
      this.toasts.show(`${this.tournament.data()!.configuration.title} reopened.`);
      this.closeDialog();
    } catch (error) {
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
      if (field === 'reason') this.reasonError.set(finaliseRuleText(field, rules[0]));
      else if (status === 409) {
        this.failure.set('The competition changed elsewhere. Nothing changed with this request. Close this dialog and try again.');
        void this.schedule.refetch();
      } else this.failure.set(field ? `${finaliseRuleText(field, rules[0])} Nothing changed.` : 'The request failed. Nothing changed. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  /** The write's schedule replaces the page's copy; the tournament label, the standings and the matches follow the events. */
  private applied(answer: ScheduleDetails): void {
    this.staleAt.set(null);
    this.queries.setQueryData(scheduleKey(this.organisation, this.tournamentId), answer);
    void this.queries.invalidateQueries({ queryKey: tournamentKey(this.organisation, this.tournamentId) });
    void this.queries.invalidateQueries({ queryKey: standingsKey(this.organisation, this.tournamentId) });
    void this.queries.invalidateQueries({ queryKey: organisationKey(this.organisation, 'match', this.tournamentId) });
  }

  protected toggle(entry: string): void {
    const next = new Set(this.open());
    if (!next.delete(entry)) next.add(entry);
    this.open.set(next);
  }
}
