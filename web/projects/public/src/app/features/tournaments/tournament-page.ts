import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, RESPONSE_INIT, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { HeraldHostPublicService } from '@herald/api-client/public';
import { Icon, Notice, StatusLabel } from '@herald/ui';
import {
  changeIcon, changeText, formatText, instantText, lifecycleLabels, lineText, localText, matchState, outcomeText, pointsText, standingsHeader, venueText,
} from './tournament-text';

/**
 * A tournament's public page, server-rendered per request (h1-public-read D-5, ADR 0011): Overview, Rounds, Standings and Changes
 * in one column. A visitor's next action is to read. Anything the API does not offer reads as "not available" with status 404.
 */
@Component({
  selector: 'app-tournament-page',
  imports: [RouterLink, Icon, Notice, StatusLabel],
  templateUrl: './tournament-page.html',
  styleUrl: './tournament-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentPage {
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId') ?? '';
  private readonly api = inject(HeraldHostPublicService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });

  protected readonly tournament = injectQuery(() => ({
    queryKey: ['public-tournament', this.tournamentId],
    queryFn: async () => {
      try {
        return await firstValueFrom(this.api.getPublicTournament(this.tournamentId));
      } catch (error) {
        // The server's answer carries the API's status, so a crawler or a cache never reads the page as found (F-01a).
        if (this.response && error instanceof HttpErrorResponse && error.status === 404) this.response.status = 404;
        throw error;
      }
    },
    retry: false,
  }));

  protected readonly page = computed(() => this.tournament.data() ?? null);
  protected readonly notAvailable = computed(() => this.tournament.error() instanceof HttpErrorResponse && (this.tournament.error() as HttpErrorResponse).status === 404);
  protected readonly labels = computed(() => (this.page() ? lifecycleLabels(this.page()!) : []));
  protected readonly cancelled = computed(() => this.page()?.competition === 'cancelled');
  protected readonly teams = computed(() => this.page()?.entryKind === 'team');
  protected readonly open = signal(new Set<string>());

  protected readonly localText = localText;
  protected readonly formatText = formatText;
  protected readonly venueText = venueText;
  protected readonly matchState = matchState;
  protected readonly outcomeText = outcomeText;
  protected readonly lineText = lineText;
  protected readonly pointsText = pointsText;
  protected readonly changeText = changeText;
  protected readonly changeIcon = changeIcon;
  protected readonly standingsHeader = standingsHeader;

  constructor() {
    const title = inject(Title);
    effect(() => {
      if (this.page()) title.setTitle(`${this.page()!.title} · Herald`);
      else if (this.notAvailable()) title.setTitle('Tournament not available · Herald');
    });
  }

  protected zoned(instant: string): string {
    return instantText(instant, this.page()?.timeZone ?? null);
  }

  protected toggle(name: string): void {
    const next = new Set(this.open());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.open.set(next);
  }
}
