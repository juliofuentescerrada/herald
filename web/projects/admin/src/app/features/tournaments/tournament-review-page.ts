import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { Button, Notice, StatusLabel } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState, QUERY_CLIENT } from '../../platform';
import {
  capacityText,
  dateTimeText,
  injectOrganisation,
  injectTournament,
  lifecycleLabels,
  profileText,
  tournamentKey,
  tournamentsKey,
  tournamentsPath,
  visibilityText,
} from './tournaments';

const words: Record<string, string> = {
  individual: 'Individual',
  team: 'Team',
  automatic: 'Automatic',
  manual: 'Manual',
  optional: 'Optional',
  mandatory: 'Mandatory',
};

/** The saved configuration, read-only, before the one action that cannot be undone. */
@Component({
  selector: 'app-tournament-review-page',
  imports: [Button, Notice, RouterLink, StatusLabel],
  template: `
    <a class="back" routerLink="..">Back to configuration</a>
    <h1>Review before publishing</h1>
    @if (tournament.isPending()) {
      <p class="panel" role="status">Loading tournament…</p>
    } @else if (!tournament.data()) {
      <section class="panel">
        <herald-notice tone="danger" heading="Tournament not available">It does not exist in this organisation, or it could not be read.</herald-notice>
        <div class="actions"><a herald-button [routerLink]="listPath">Back to tournaments</a></div>
      </section>
    } @else {
      <p class="lead">Read-only configuration summary · {{ tournament.data()!.configuration.title }}</p>
      <p class="labels">
        @for (label of labels(); track label) {
          <herald-status-label>{{ label }}</herald-status-label>
        }
      </p>
      <div class="column">
        @if (state() === 'changed') {
          <herald-notice tone="warning" heading="The tournament changed since you opened this review">
            It was not published. The summary below is the current configuration: review it again before publishing.
          </herald-notice>
        }
        @if (state() === 'failed') {
          <herald-notice tone="danger" heading="Tournament not published">Publication failed, so it is still a draft. Try again when you are ready.</herald-notice>
        }
        @if (blocked(); as why) {
          <herald-notice tone="warning" heading="This tournament cannot be published from here">{{ why }}</herald-notice>
        }
        <section class="panel">
          @for (section of summary(); track section.heading) {
            <h2>{{ section.heading }}</h2>
            <dl>
              @for (item of section.items; track item[0]) {
                <div [class.wide]="item[2]">
                  <dt>{{ item[0] }}</dt>
                  <dd>{{ item[1] }}</dd>
                </div>
              }
            </dl>
          }
          <p class="statement"><strong>Publishing keeps registration not open.</strong> It creates no entries, pairings or play.</p>
          <p class="statement">A published tournament cannot be unpublished.</p>
          @if (state() === 'publishing') {
            <p class="help" role="status">Publishing. Please wait; do not submit again.</p>
          }
          <div class="actions">
            @if (!blocked()) {
              <button herald-button variant="primary" type="button" [loading]="state() === 'publishing'" (click)="publish()">
                {{ state() === 'publishing' ? 'Publishing…' : state() === 'failed' ? 'Try again' : 'Publish tournament' }}
              </button>
            }
            <a herald-button routerLink="..">Edit configuration</a>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    h1 { font-size: 32px; margin: var(--herald-space-4) 0 var(--herald-space-2); }
    .back { color: var(--herald-color-text-secondary); }
    .labels { display: flex; flex-wrap: wrap; gap: var(--herald-space-2); margin: var(--herald-space-4) 0 var(--herald-space-6); }
    .column { display: flex; flex-direction: column; gap: var(--herald-space-6); }
    .column herald-notice { display: flex; }
    .panel h2 { border-top: 1px solid var(--herald-color-border-default); padding-top: var(--herald-space-6); }
    .panel h2:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: var(--herald-space-6); margin: 0 0 var(--herald-space-6); }
    dt { color: var(--herald-color-text-secondary); margin-bottom: var(--herald-space-1); }
    dd { margin: 0; font-size: var(--herald-text-lg); }
    .wide { grid-column: 1 / -1; }
    .statement { margin: 0 0 var(--herald-space-2); }
    @media (max-width: 699px) { h1 { font-size: 28px; } dl { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentReviewPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly router = inject(Router);
  private readonly access = inject(AccessState);
  private readonly organisation = injectOrganisation();

  protected readonly listPath = tournamentsPath(this.organisation);
  protected readonly tournament = injectTournament(this.organisation);
  protected readonly state = signal<'reviewing' | 'publishing' | 'failed' | 'changed'>('reviewing');
  protected readonly labels = computed(() => lifecycleLabels(this.tournament.data()!));
  /** Why publishing is not offered, or null when it is. */
  protected readonly blocked = computed(() => {
    const details = this.tournament.data();
    if (details?.publication === 'published') return 'It is already published.';
    return details?.missingForPublication.length ? 'Some values are still missing for publication. Edit the configuration to complete them.' : null;
  });

  protected readonly summary = computed(() => {
    const c = this.tournament.data()!.configuration;
    const word = (value: string | null | undefined) => (value ? (words[value] ?? value) : 'Not set');
    const at = (value: string | null | undefined) => dateTimeText(value) || 'Not set';
    const players = (value: number | null | undefined) => (value == null ? 'Not set' : `${value} players`);
    type Item = readonly [string, string, boolean?];
    const sections: { heading: string; items: Item[] }[] = [
      {
        heading: 'Tournament details',
        items: [['Title', c.title], ['Game / variant', c.gameVariant ?? 'Not set'], ['Entry kind', word(c.entryKind)], ['Capacity', capacityText(c)]],
      },
    ];
    if (c.entryKind === 'team')
      sections.push({
        heading: 'Team structure',
        items: [
          ['Minimum roster size', players(c.minimumRosterSize)],
          ['Maximum roster size', players(c.maximumRosterSize)],
          ['Active players per side', players(c.activePlayersPerSide)],
        ],
      });
    sections.push(
      {
        heading: 'Competition profile',
        items: [['Profile', profileText], ['Scoring', 'Win 3 · Draw 1 · Loss 0'], ['Equal points', 'Shared position']],
      },
      {
        heading: 'Dates and location',
        items: [
          ['Registration opening', at(c.registrationOpensAt)],
          ['Registration closure', at(c.registrationClosesAt)],
          ['Planned start', at(c.plannedStartAt)],
          ['Reference time zone', c.timeZone ?? 'Not set'],
          ['Location', c.location === 'online' ? 'Online' : `On-site · ${c.venue ?? 'Not set'}`],
        ],
      },
      {
        heading: 'Admission and visibility',
        items: [['Admission', word(c.admission)], ['Check-in', word(c.checkIn)], ['Visibility', c.visibility ? visibilityText[c.visibility] : 'Not set', true]],
      },
    );
    return sections;
  });

  /** Publishes the revision on screen: a tournament that changed since is shown again instead. */
  protected async publish(): Promise<void> {
    const reviewed = this.tournament.data();
    if (!reviewed || this.state() === 'publishing') return;
    this.state.set('publishing');
    try {
      const published = await firstValueFrom(
        this.api.publishTournament<TournamentDetails>(this.organisation, reviewed.id, { expectedRevision: reviewed.revision }),
      );
      this.queries.setQueryData(tournamentKey(this.organisation, published.id), published);
      void this.queries.invalidateQueries({ queryKey: tournamentsKey(this.organisation) });
      await this.router.navigate([this.listPath, published.id]);
    } catch (error) {
      // Lost access shows its own state; nothing to add here.
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status === 409 || status === 400) {
        // Stale or no longer complete: either way the reviewed configuration is not the current one.
        await this.tournament.refetch();
        this.state.set('changed');
      } else {
        this.state.set('failed');
      }
    }
  }
}
