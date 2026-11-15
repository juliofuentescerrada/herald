import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeraldHostAdminService, ScheduleDetails, StandingsView, TournamentDetails } from '@herald/api-client/admin';
import { Button, Icon, Notice, StatusLabel } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext } from '../../platform';
import { TournamentNav } from '../../shared';
import { lineText, pointsText, scheduleKey, standingsKey, tournamentKey } from './standings';

/** A running tournament's provisional standings, each entrant's points explained (F-09, h1-standings D-3, D-4). */
@Component({
  selector: 'app-standings-page',
  imports: [Button, Icon, Notice, RouterLink, StatusLabel, TournamentNav],
  templateUrl: './standings-page.html',
  styleUrl: './standings-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;

  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  protected readonly running = computed(() => this.tournament.data()?.competition === 'running');
  /** Competition's own view of the matches: when it knows more resolutions than the standings show, they are updating. */
  private readonly schedule = injectQuery(() => ({
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
    const known = this.schedule.data()?.matches.filter((match) => match.state === 'resolved').length ?? 0;
    return known > (this.standings.data()?.resolvedMatches ?? 0);
  });
  protected readonly teams = computed(() => this.tournament.data()?.configuration.entryKind === 'team');
  protected readonly view = computed(() => this.standings.data() ?? null);
  /** The rows whose explanation is open, by entry. */
  protected readonly open = signal<ReadonlySet<string>>(new Set());

  protected readonly lineText = lineText;
  protected readonly pointsText = pointsText;

  constructor() {
    effect(() => this.polling.set(this.updating()));
  }

  protected toggle(entry: string): void {
    const next = new Set(this.open());
    if (!next.delete(entry)) next.add(entry);
    this.open.set(next);
  }
}
