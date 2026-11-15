import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeraldHostAdminService, HttpValidationProblemDetails, MatchView, Outcome, problemOf, RecordResult, SideDetails, TournamentDetails } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, QUERY_CLIENT } from '../../platform';
import { instantText, lifecycleLabels, resultText } from '../../shared';
import { matchKey, possessive, ruleText, scheduleKey, splitBlocker, tournamentKey } from './matches';

type SideName = 'first' | 'second';

/** The causes the Result panel offers; an absence of one side or both is one choice (h1-exceptional-outcomes D-3). */
type CauseChoice = 'played' | 'concession' | 'absence' | 'noContest';

interface Failure {
  readonly heading: string;
  readonly text: string;
}

/** A match of a running competition: its lineups, for a team match, and its start (match-lineups). */
@Component({
  selector: 'app-match-page',
  imports: [Button, Dialog, Icon, Notice, RouterLink, StatusLabel],
  templateUrl: './match-page.html',
  styleUrl: './match-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly route = inject(ActivatedRoute).snapshot.paramMap;
  private readonly tournamentId = this.route.get('tournamentId')!;
  private readonly matchId = this.route.get('matchId')!;
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly startDialog = viewChild.required<TemplateRef<DialogContext>>('startDialog');
  private open: DialogRef | null = null;

  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  protected readonly match = injectQuery(() => ({
    queryKey: matchKey(this.organisation, this.tournamentId, this.matchId),
    queryFn: () => firstValueFrom(this.api.getMatch<MatchView>(this.organisation, this.tournamentId, this.matchId)),
    retry: false,
  }));

  protected readonly state = signal<'ready' | 'busy' | 'conflict'>('ready');
  protected readonly failure = signal<Failure | null>(null);
  /** The owner's unsaved choice per side; null shows the current lineup. */
  protected readonly chosen = signal<Record<SideName, readonly string[] | null>>({ first: null, second: null });

  protected readonly labels = computed(() => (this.tournament.data() ? lifecycleLabels(this.tournament.data()!) : []));
  protected readonly zone = computed(() => this.tournament.data()?.configuration.timeZone ?? 'UTC');
  protected readonly team = computed(() => this.match.data()?.activePlayers != null);
  /** Started, in play or resolved: its lineups are locked (h1-match-lineups D-3). */
  protected readonly started = computed(() => !!this.match.data()?.start);
  protected readonly scheduled = computed(() => this.match.data()?.state === 'scheduled');
  protected readonly stateText = { scheduled: 'Scheduled', inPlay: 'In play', resolved: 'Resolved' } as const;
  protected readonly stateTone = { scheduled: 'neutral', inPlay: 'info', resolved: 'success' } as const;
  /** Nothing is preselected: the owner chooses what happened, then that cause's fields (§8.1, D-3). */
  protected readonly cause = signal<CauseChoice | null>(null);
  protected readonly outcome = signal<Outcome | null>(null);
  protected readonly conceding = signal<SideName | null>(null);
  protected readonly absent = signal<SideName | 'both' | null>(null);
  protected readonly playTookPlace = signal<boolean | null>(null);
  protected readonly reason = signal('');
  /** A team match not yet in play cannot record play (D-2). */
  protected readonly playWithoutStart = computed(() => this.team() && !this.started() && this.cause() !== 'played' && this.cause() !== 'absence' && this.playTookPlace() === true);
  /** Reused when the same result is sent again after a lost answer (match-results: A double submission). */
  private resultOperation: { readonly id: string; readonly revision: number; readonly body: string } | null = null;
  protected readonly resultSummary = computed(() => {
    const result = this.match.data()?.result;
    if (!result) return null;
    const text = resultText(result, this.names().first, this.names().second);
    return result.cause === 'played' ? `${text} · played` : text;
  });
  /** The chosen cause as the API's command fields, or null while incomplete. */
  private readonly resultBody = computed((): Omit<RecordResult, 'operationId' | 'expectedRevision'> | null => {
    const played = this.playTookPlace();
    switch (this.cause()) {
      case 'played': return this.outcome() ? { cause: 'played', outcome: this.outcome() } : null;
      case 'concession': return this.conceding() && played !== null ? { cause: 'concession', entrant: this.conceding(), played } : null;
      case 'absence': {
        const absent = this.absent();
        return absent === 'both' ? { cause: 'doubleAbsence' } : absent ? { cause: 'singleAbsence', entrant: absent } : null;
      }
      case 'noContest': return this.reason().trim() && played !== null ? { cause: 'noContest', played, reason: this.reason().trim() } : null;
      default: return null;
    }
  });
  /** Why a result cannot be recorded now, or null. */
  protected readonly recordBlocked = computed(() => {
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest version first.';
    if (this.playWithoutStart()) return 'Start the match first, or choose “No”.';
    if (this.resultBody()) return null;
    switch (this.cause()) {
      case 'played': return 'Choose the outcome first.';
      case 'concession': return this.conceding() ? 'Choose whether play took place.' : 'Choose who conceded.';
      case 'absence': return 'Choose who was absent.';
      case 'noContest': return this.reason().trim() ? 'Choose whether play took place.' : 'A no contest needs a reason.';
      default: return 'Choose what happened first.';
    }
  });
  protected readonly names = computed(() => ({ first: this.match.data()?.first.entrant.name ?? '', second: this.match.data()?.second.entrant.name ?? '' }));
  protected readonly rostersUnknown = computed(() => this.team() && (!this.match.data()?.first.roster || !this.match.data()?.second.roster));
  /** Why the match cannot start now, in words; the first one describes the disabled button. */
  protected readonly blockers = computed(() => {
    const match = this.match.data();
    if (!match) return [];
    return match.blockers.map((code) => {
      const [field, rule] = splitBlocker(code);
      return ruleText(field, rule, match.activePlayers, this.names().first, this.names().second);
    });
  });
  protected readonly startBlocked = computed(() => {
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest version first.';
    if (this.dirty()) return 'Save or discard the lineup changes first.';
    return this.blockers()[0] ?? null;
  });
  protected readonly dirty = computed(() => this.chosen().first !== null || this.chosen().second !== null);

  protected readonly sides = computed(() => {
    const match = this.match.data();
    if (!match) return [];
    return (['first', 'second'] as const).map((name) => this.sideOf(name, match[name]));
  });

  protected readonly zoned = (instant: string | null | undefined) => (instant ? `${instantText(instant, this.zone())} · ${this.zone()}` : '');

  protected toggle(side: SideName, playerId: string, checked: boolean): void {
    const current = this.selection(side);
    const next = checked ? [...current, playerId] : current.filter((id) => id !== playerId);
    this.chosen.update((chosen) => ({ ...chosen, [side]: next }));
    this.failure.set(null);
  }

  protected discard(side: SideName): void {
    this.chosen.update((chosen) => ({ ...chosen, [side]: null }));
  }

  protected save(side: SideName): void {
    const match = this.match.data()!;
    const players = [...this.selection(side)];
    void this.run(
      `${possessive(this.names()[side])} lineup was not saved`,
      () => firstValueFrom(this.api.recordLineup<MatchView>(this.organisation, this.tournamentId, this.matchId, side, { expectedRevision: match.revision, players })),
      () => `${possessive(this.names()[side])} lineup saved.`,
      () => this.discard(side),
    );
  }

  protected askStart(trigger: HTMLElement): void {
    if (this.startBlocked()) return;
    // An individual match starts at once; a team match asks first because it locks both lineups (A-2).
    if (!this.team()) {
      this.start();
      return;
    }
    this.failure.set(null);
    const open = this.dialogs.open(this.startDialog(), { trigger, viewContainerRef: this.viewContainerRef });
    this.open = open;
    void open.closed.then(() => {
      if (this.open === open) this.open = null;
    });
  }

  protected start(): void {
    const match = this.match.data()!;
    void this.run(
      'The match did not start',
      () => firstValueFrom(this.api.startMatch<MatchView>(this.organisation, this.tournamentId, this.matchId, { expectedRevision: match.revision })),
      () => 'Match started.',
    );
  }

  protected record(): void {
    const match = this.match.data()!;
    const fields = this.resultBody();
    if (!fields || this.recordBlocked()) return;
    const key = JSON.stringify(fields);
    if (this.resultOperation?.revision !== match.revision || this.resultOperation.body !== key) {
      this.resultOperation = { id: crypto.randomUUID(), revision: match.revision, body: key };
    }
    const body: RecordResult = { operationId: this.resultOperation.id, expectedRevision: match.revision, ...fields };
    void this.run(
      'The result was not recorded',
      () => firstValueFrom(this.api.recordResult<MatchView>(this.organisation, this.tournamentId, this.matchId, body)),
      () => 'Result recorded.',
      () => {
        this.choose(null);
        this.resultOperation = null;
      },
    );
  }

  /** A new cause clears the previous cause's fields, so only the chosen cause's answers are sent. */
  protected choose(cause: CauseChoice | null): void {
    this.cause.set(cause);
    this.outcome.set(null);
    this.conceding.set(null);
    this.absent.set(null);
    this.playTookPlace.set(null);
    this.reason.set('');
    this.failure.set(null);
  }

  protected close(): void {
    this.open?.close();
  }

  protected async reload(): Promise<void> {
    this.chosen.set({ first: null, second: null });
    await this.match.refetch();
    this.state.set('ready');
    this.failure.set(null);
  }

  private selection(side: SideName): readonly string[] {
    const chosen = this.chosen()[side];
    if (chosen) return chosen;
    const lineups = this.match.data()?.[side].lineups ?? [];
    return lineups.at(-1)?.players.map((player) => player.playerId) ?? [];
  }

  private sideOf(name: SideName, side: SideDetails) {
    const selected = this.selection(name);
    const lineup = side.lineups.at(-1) ?? null;
    const required = this.match.data()!.activePlayers ?? 0;
    const locked = this.started() ? side.lineups.find((each) => each.number === this.match.data()!.start?.[name === 'first' ? 'firstLineup' : 'secondLineup']) ?? null : null;
    const lockedIds = new Set(locked?.players.map((player) => player.playerId));
    return {
      name,
      entrant: side.entrant.name,
      roster: side.roster ?? [],
      selected: new Set(selected),
      count: selected.length,
      required,
      complete: selected.length === required,
      dirty: this.chosen()[name] !== null,
      lineup,
      locked,
      reserves: locked ? (side.roster ?? []).filter((player) => !lockedIds.has(player.playerId)) : [],
      history: [...side.lineups].reverse(),
    };
  }

  /** One write at a time; its answer is the match as it now is. */
  private async run(heading: string, write: () => Promise<MatchView>, done: () => string, after?: () => void): Promise<void> {
    if (this.state() !== 'ready') return;
    this.state.set('busy');
    this.failure.set(null);
    try {
      const answer = await write();
      this.state.set('ready');
      this.queries.setQueryData(matchKey(this.organisation, this.tournamentId, this.matchId), answer);
      void this.queries.invalidateQueries({ queryKey: scheduleKey(this.organisation, this.tournamentId) });
      after?.();
      this.toasts.show(done());
      this.close();
    } catch (error) {
      this.state.set('ready');
      this.close();
      this.fail(heading, error);
    }
  }

  private fail(heading: string, error: unknown): void {
    // Lost access shows its own state; nothing to add here.
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'match-revision-conflict') {
      this.state.set('conflict');
      return;
    }
    const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
    if (field) {
      const match = this.match.data();
      // A player outside the frozen roster comes back named by identifier: say who it is.
      const player = field.startsWith('player-')
        ? [...(match?.first.roster ?? []), ...(match?.second.roster ?? [])].find((each) => `player-${each.playerId}` === field)?.name
        : undefined;
      const text = player ? `${player} is not on that team’s frozen roster.` : ruleText(field, rules[0], match?.activePlayers ?? null, this.names().first, this.names().second);
      this.failure.set({ heading, text: `${text} Nothing changed.` });
      void this.match.refetch();
    } else {
      this.failure.set({ heading, text: 'The request failed. Nothing changed. Try again.' });
    }
  }
}
