import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { CompetitorDetails, HeraldHostAdminService, HttpValidationProblemDetails, problemOf, RosterPlayerDetails, ScheduleDetails } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { firstValueFrom, Observable } from 'rxjs';
import { AccessState, organisationKey, QUERY_CLIENT } from '../../platform';
import { possessive } from '../../shared';
import { entrantStatusLabel, playerStatusLabel, ruleText, scheduleKey, standingsKey } from './schedule';

type Departure = 'withdraw' | 'disqualify';
type PlayerAction = 'withdraw' | 'sanction';

/**
 * The running competition's entrants with their status, departures and, for teams, the frozen roster's player actions
 * (h1-round-operations D-5). Each write answers with the schedule, which replaces the page's copy.
 */
@Component({
  selector: 'app-entrants-panel',
  imports: [Button, Dialog, Icon, Notice, StatusLabel],
  templateUrl: './entrants-panel.html',
  styleUrl: './entrants-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntrantsPanel {
  readonly schedule = input.required<ScheduleDetails>();
  readonly organisation = input.required<string>();
  readonly tournamentId = input.required<string>();
  readonly zoned = input.required<(instant: string | null | undefined) => string>();

  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly departureDialog = viewChild.required<TemplateRef<DialogContext>>('departureDialog');
  private readonly rosterDialog = viewChild.required<TemplateRef<DialogContext>>('rosterDialog');
  private open: DialogRef | null = null;

  protected readonly entrantStatusLabel = entrantStatusLabel;
  protected readonly playerStatusLabel = playerStatusLabel;
  protected readonly possessive = possessive;
  protected readonly busy = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonError = signal<string | null>(null);
  /** The departure being confirmed, and its operation identity, reused if the same confirmation is sent again (D-2). */
  protected readonly departure = signal<{ readonly entryId: string; readonly kind: Departure; readonly operationId: string } | null>(null);
  protected readonly rosterOf = signal<string | null>(null);
  protected readonly playerAction = signal<{ readonly playerId: string; readonly kind: PlayerAction } | null>(null);

  protected readonly entrant = (entryId: string | null | undefined) => this.schedule().entrants.find((entrant) => entrant.entryId === entryId);
  protected readonly departing = computed(() => this.entrant(this.departure()?.entryId));
  protected readonly team = computed(() => this.entrant(this.rosterOf()));
  protected readonly acting = computed(() => this.team()?.roster?.find((player) => player.playerId === this.playerAction()?.playerId));

  /** What a departure resolves: its scheduled matches as absences and its match in play as a concession after play (D-2). */
  protected readonly consequence = computed(() => {
    const entrant = this.departing();
    if (!entrant) return '';
    const mine = this.schedule().matches.filter((match) => match.first.entryId === entrant.entryId || match.second.entryId === entrant.entryId);
    const scheduled = mine.filter((match) => match.state === 'scheduled').length;
    const inPlay = mine.filter((match) => match.state === 'inPlay').length;
    const parts = [`${possessive(entrant.name)} played results stay.`];
    parts.push(scheduled ? `${scheduled} unplayed ${scheduled === 1 ? 'match' : 'matches'} will be resolved as ${possessive(entrant.name)} absence, each opponent winning.` : 'No unplayed match is left to resolve.');
    if (inPlay) parts.push(`${inPlay === 1 ? 'Its match in play becomes its concession' : `Its ${inPlay} matches in play become its concessions`} after play.`);
    parts.push('This cannot be undone.');
    return parts.join(' ');
  });

  protected askDeparture(entrant: CompetitorDetails, kind: Departure, trigger: HTMLElement): void {
    this.departure.set({ entryId: entrant.entryId, kind, operationId: crypto.randomUUID() });
    this.openDialog(this.departureDialog(), trigger);
  }

  protected showRoster(entrant: CompetitorDetails, trigger: HTMLElement): void {
    this.rosterOf.set(entrant.entryId);
    this.playerAction.set(null);
    this.openDialog(this.rosterDialog(), trigger);
  }

  protected askPlayer(player: RosterPlayerDetails, kind: PlayerAction): void {
    this.playerAction.set({ playerId: player.playerId, kind });
    this.reason.set('');
    this.reasonError.set(null);
    this.failure.set(null);
  }

  protected confirmDeparture(): void {
    const departure = this.departure()!;
    const entrant = this.departing()!;
    const reason = this.reason().trim();
    if (!reason) {
      this.reasonError.set(ruleText('reason', 'required'));
      return;
    }
    const body = { operationId: departure.operationId, expectedRevision: this.schedule().revision, reason };
    const write = departure.kind === 'withdraw'
      ? this.api.withdrawEntrant<ScheduleDetails>(this.organisation(), this.tournamentId(), entrant.entryId, body)
      : this.api.disqualifyEntrant<ScheduleDetails>(this.organisation(), this.tournamentId(), entrant.entryId, body);
    void this.run(write, (answer) => {
      const resolved = answer.operations!.resolved - this.schedule().operations!.resolved;
      return `${entrant.name} ${departure.kind === 'withdraw' ? 'withdrawn' : 'disqualified'}. ${resolved} ${resolved === 1 ? 'match' : 'matches'} resolved.`;
    }, true);
  }

  protected confirmPlayer(): void {
    const action = this.playerAction()!;
    const player = this.acting()!;
    const reason = this.reason().trim();
    if (action.kind === 'sanction' && !reason) {
      this.reasonError.set(ruleText('reason', 'required'));
      return;
    }
    const expectedRevision = this.schedule().revision;
    const write = action.kind === 'sanction'
      ? this.api.sanctionPlayer<ScheduleDetails>(this.organisation(), this.tournamentId(), this.rosterOf()!, player.playerId, { expectedRevision, reason })
      : this.api.withdrawPlayer<ScheduleDetails>(this.organisation(), this.tournamentId(), this.rosterOf()!, player.playerId, { expectedRevision, reason: reason || null });
    void this.run(write, () => `${player.name} ${action.kind === 'sanction' ? 'sanctioned' : 'withdrawn from the tournament'}.`, false);
  }

  protected lift(player: RosterPlayerDetails): void {
    this.playerAction.set(null);
    const write = this.api.liftSanction<ScheduleDetails>(this.organisation(), this.tournamentId(), this.rosterOf()!, player.playerId, { expectedRevision: this.schedule().revision });
    void this.run(write, () => `${possessive(player.name)} sanction lifted.`, false);
  }

  protected close(): void {
    this.open?.close();
  }

  protected cancelPlayer(): void {
    this.playerAction.set(null);
    this.failure.set(null);
  }

  private openDialog(template: TemplateRef<DialogContext>, trigger: HTMLElement): void {
    this.reason.set('');
    this.reasonError.set(null);
    this.failure.set(null);
    const open = this.dialogs.open(template, { trigger, viewContainerRef: this.viewContainerRef });
    this.open = open;
    void open.closed.then(() => {
      if (this.open === open) this.open = null;
    });
  }

  /** One write at a time; a departure closes its dialog, a player action keeps the roster open. */
  private async run(write: Observable<ScheduleDetails>, done: (answer: ScheduleDetails) => string, closes: boolean): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.failure.set(null);
    try {
      const answer = await firstValueFrom(write);
      const text = done(answer);
      this.queries.setQueryData(scheduleKey(this.organisation(), this.tournamentId()), answer);
      // A departure resolves matches and flags the entrant, a player change moves start blockers: matches and standings are asked again.
      void this.queries.invalidateQueries({ queryKey: standingsKey(this.organisation(), this.tournamentId()) });
      void this.queries.invalidateQueries({ queryKey: organisationKey(this.organisation(), 'match', this.tournamentId()) });
      this.toasts.show(text);
      this.playerAction.set(null);
      if (closes) this.close();
    } catch (error) {
      this.fail(error);
    } finally {
      this.busy.set(false);
    }
  }

  private fail(error: unknown): void {
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409) {
      this.failure.set('The schedule changed elsewhere. Nothing changed with this request. Close this dialog and try again on the latest schedule.');
      void this.queries.invalidateQueries({ queryKey: scheduleKey(this.organisation(), this.tournamentId()) });
      return;
    }
    const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
    if (field === 'reason') this.reasonError.set(ruleText(field, rules[0]));
    else if (field) this.failure.set(`${ruleText(field, rules[0])} Nothing changed.`);
    else this.failure.set('The request failed. Nothing changed. Try again.');
  }
}
