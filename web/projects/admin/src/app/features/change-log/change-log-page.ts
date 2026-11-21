import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeLogItem, HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { Button, Icon, Notice, StatusLabel } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AppContext, organisationKey, tournamentKey } from '../../platform';
import { instantText, TournamentNav } from '../../shared';
import { Group, groups, iconOf, inGroup, reasonLink, sentence } from './change-log';

/**
 * A tournament's change log, newest first, with a filter by kind (F-10, h1-change-log D-4). Read-only: Herald records the
 * changes and delivers them to nobody; the "Public" label says what visitors also see.
 */
@Component({
  selector: 'app-change-log-page',
  imports: [Button, Icon, Notice, RouterLink, StatusLabel, TournamentNav],
  templateUrl: './change-log-page.html',
  styleUrl: './change-log-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeLogPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;

  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  protected readonly log = injectQuery(() => ({
    queryKey: organisationKey(this.organisation, 'change-log', this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getChangeLog<ChangeLogItem[]>(this.organisation, this.tournamentId)),
    retry: false,
  }));

  protected readonly groups = groups;
  protected readonly group = signal<Group>('All');
  protected readonly shown = computed(() => (this.log.data() ?? []).filter((item) => inGroup(item, this.group())));
  private readonly zone = computed(() => this.tournament.data()?.configuration.timeZone ?? 'UTC');

  protected readonly sentence = sentence;
  protected readonly iconOf = iconOf;
  protected readonly reasonLink = reasonLink;
  protected readonly byline = (item: ChangeLogItem) => [item.actorName, instantText(item.at, this.zone())].filter(Boolean).join(' · ');
}
