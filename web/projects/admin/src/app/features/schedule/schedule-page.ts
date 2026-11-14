import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  HeraldHostAdminService,
  HttpValidationProblemDetails,
  problemOf,
  ScheduleDetails,
  Seeding,
  TournamentDetails,
} from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT } from '../../platform';
import { instantText, lifecycleLabels } from '../../shared';
import { blockerText, fieldKey, ruleText, scheduleKey, seedingText, sizeText, tournamentKey } from './schedule';

interface Failure {
  readonly heading: string;
  readonly text: string;
}

/** A tournament's round-robin: the draft from the eligible field, its publication and withdrawal (F-06, round-robin-pairings). */
@Component({
  selector: 'app-schedule-page',
  imports: [Button, Dialog, Icon, Notice, RouterLink, StatusLabel],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly withdrawDialog = viewChild.required<TemplateRef<DialogContext>>('withdrawDialog');
  private open: DialogRef | null = null;
  /** A failure inside the open dialog is said there, not on the page behind it. */
  protected readonly dialogOpen = signal(false);

  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  /** A schedule exists once Registration has reported the published tournament's eligible field. */
  protected readonly schedule = injectQuery(() => ({
    queryKey: scheduleKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getSchedule<ScheduleDetails>(this.organisation, this.tournamentId)),
    enabled: this.tournament.data()?.publication === 'published',
    retry: false,
  }));

  protected readonly state = signal<'ready' | 'busy' | 'conflict'>('ready');
  protected readonly failure = signal<Failure | null>(null);
  /** Nothing is preselected: the owner chooses the seeding each time (A-2). */
  protected readonly seeding = signal<Seeding | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonError = signal<string | null>(null);
  /** Reused when the same generation is sent again after a lost answer (D-8). */
  private generation: { readonly id: string; readonly revision: number; readonly seeding: Seeding } | null = null;

  protected readonly unavailable = computed(() => this.tournament.isError() || (this.tournament.data() && this.tournament.data()!.publication !== 'published'));
  protected readonly notYet = computed(() => this.schedule.error() instanceof HttpErrorResponse && (this.schedule.error() as HttpErrorResponse).status === 404);
  protected readonly zone = computed(() => this.tournament.data()?.configuration.timeZone ?? 'UTC');
  protected readonly labels = computed(() => (this.tournament.data() ? lifecycleLabels(this.tournament.data()!) : []));
  protected readonly teams = computed(() => this.tournament.data()?.configuration.entryKind === 'team');

  protected readonly current = computed(() => this.schedule.data()?.current ?? null);
  protected readonly draft = computed(() => this.schedule.data()?.draft ?? null);
  /** What the page shows: the published revision, otherwise the draft. */
  protected readonly pairings = computed(() => this.current()?.pairings ?? this.draft()?.pairings ?? null);
  protected readonly blockers = computed(() => (this.schedule.data()?.blockers ?? []).map((code) => ({ code, ...(blockerText[code] ?? { condition: code, fix: '', where: 'entries' as const }) })));
  protected readonly statusText = computed(() => {
    if (this.current()) return `Published · revision ${this.current()!.number}`;
    if (this.draft()) return this.draft()!.stale ? 'Stale draft' : 'Draft';
    return 'No draft';
  });
  protected readonly statusTone = computed(() => (this.current() ? 'success' : this.draft()?.stale ? 'warning' : 'neutral'));
  protected readonly heading = computed(() => (this.pairings() ? sizeText(this.pairings()!, this.teams()) : 'Generate a draft'));
  protected readonly meta = computed(() => {
    const pairings = this.pairings();
    if (!pairings) return `Single round-robin · ${this.schedule.data()!.eligible} eligible ${this.teams() ? 'teams' : 'players'}. Generating sends nothing and creates no result.`;
    return `Single round-robin · ${seedingText(pairings)} · ${this.current() ? 'published' : 'generated'}`;
  });
  /** Kept on one line with its time zone (#55). */
  protected readonly when = computed(() => (this.current() ? this.zoned(this.current()!.publishedAt) : this.draft() ? this.zoned(this.draft()!.generatedAt) : ''));
  /** Why generating is unavailable now, or null. */
  protected readonly generateBlocked = computed(() => {
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest version first.';
    const first = this.blockers()[0];
    if (first) return first.fix;
    return this.seeding() ? null : 'Choose the seeding first.';
  });
  protected readonly withdrawn = computed(() => (this.schedule.data()?.history ?? []).filter((publication) => publication.withdrawnAt));

  protected readonly zoned = (instant: string | null | undefined) => (instant ? `${instantText(instant, this.zone())} · ${this.zone()}` : '');
  protected readonly names = (entrants: readonly { name: string }[]) => entrants.map((entrant) => entrant.name).join(', ');

  protected generate(): void {
    const seeding = this.seeding();
    const schedule = this.schedule.data();
    if (!seeding || !schedule || this.generateBlocked()) return;
    if (this.generation?.revision !== schedule.revision || this.generation.seeding !== seeding) {
      this.generation = { id: crypto.randomUUID(), revision: schedule.revision, seeding };
    }
    const body = { operationId: this.generation.id, expectedRevision: schedule.revision, seeding };
    void this.run('Draft was not generated', () => firstValueFrom(this.api.generateDraft<ScheduleDetails>(this.organisation, this.tournamentId, body)), () => 'Draft generated.');
  }

  protected publish(): void {
    const schedule = this.schedule.data()!;
    void this.run(
      'Schedule was not published',
      () => firstValueFrom(this.api.publishSchedule<ScheduleDetails>(this.organisation, this.tournamentId, { expectedRevision: schedule.revision })),
      (answer) => `Schedule published · revision ${answer.current?.number}.`,
    );
  }

  protected askWithdraw(trigger: HTMLElement): void {
    this.reason.set('');
    this.reasonError.set(null);
    this.failure.set(null);
    const open = this.dialogs.open(this.withdrawDialog(), { trigger, viewContainerRef: this.viewContainerRef });
    this.open = open;
    this.dialogOpen.set(true);
    void open.closed.then(() => {
      if (this.open !== open) return;
      this.open = null;
      this.dialogOpen.set(false);
      this.failure.set(null);
    });
  }

  protected confirmWithdraw(): void {
    const reason = this.reason().trim();
    if (!reason) {
      this.reasonError.set(ruleText('reason', 'required'));
      return;
    }
    const schedule = this.schedule.data()!;
    const number = schedule.current?.number;
    void this.run(
      'Schedule was not withdrawn',
      () => firstValueFrom(this.api.withdrawSchedule<ScheduleDetails>(this.organisation, this.tournamentId, { expectedRevision: schedule.revision, reason })),
      () => `Revision ${number} withdrawn.`,
    );
  }

  protected close(): void {
    this.open?.close();
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.schedule.refetch(), this.tournament.refetch()]);
    this.state.set('ready');
    this.failure.set(null);
  }

  /** One write at a time; its answer is the schedule as it now is. */
  private async run(heading: string, write: () => Promise<ScheduleDetails>, done: (answer: ScheduleDetails) => string): Promise<void> {
    if (this.state() !== 'ready') return;
    this.state.set('busy');
    this.failure.set(null);
    try {
      const answer = await write();
      this.state.set('ready');
      this.queries.setQueryData(scheduleKey(this.organisation, this.tournamentId), answer);
      // Publishing locks the field and reopening: the tournament and its entries are asked again.
      void this.queries.invalidateQueries({ queryKey: tournamentKey(this.organisation, this.tournamentId) });
      void this.queries.invalidateQueries({ queryKey: fieldKey(this.organisation, this.tournamentId) });
      this.generation = null;
      this.seeding.set(null);
      this.toasts.show(done(answer));
      this.close();
    } catch (error) {
      this.state.set('ready');
      this.fail(heading, error);
    }
  }

  private fail(heading: string, error: unknown): void {
    // Lost access shows its own state; nothing to add here.
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'schedule-revision-conflict') {
      this.state.set('conflict');
      this.close();
      return;
    }
    const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
    if (field === 'reason') {
      this.reasonError.set(ruleText(field, rules[0]));
    } else if (field) {
      // The schedule or its field changed since it was read: what the owner sees is brought up to date.
      this.failure.set({ heading, text: `${ruleText(field, rules[0])} Nothing changed.` });
      void this.schedule.refetch();
    } else {
      this.failure.set({ heading, text: 'The request failed. Nothing changed. Try again.' });
    }
  }
}
