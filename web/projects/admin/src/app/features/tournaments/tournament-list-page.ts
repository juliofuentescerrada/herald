import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeraldHostAdminService, TournamentSummary } from '@herald/api-client/admin';
import { Button, Icon, Notice, StatusLabel } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { injectWorkingOrganisation } from '../../platform';
import { admittedText, capacityText, dateTimeText, injectOrganisation, lifecycleLabels, locationText, tournamentsKey } from './tournaments';

/** The organisation's tournaments, newest first, each with its three lifecycle facts. */
@Component({
  selector: 'app-tournament-list-page',
  imports: [Button, Icon, Notice, RouterLink, StatusLabel],
  template: `
    <header class="heading">
      <div>
        <h1>Tournaments</h1>
        <p class="lead">{{ organisation.data()?.name }} · your organising workspace</p>
      </div>
      @if (tournaments.data()?.length) {
        <a herald-button variant="primary" routerLink="new">Create tournament</a>
      }
    </header>

    @if (tournaments.isPending()) {
      <p class="panel" role="status">Loading tournaments…</p>
    } @else if (tournaments.isError()) {
      <section class="panel">
        <herald-notice tone="danger" heading="Tournaments did not load">Nothing is shown because the list could not be read. Try again.</herald-notice>
        <div class="actions">
          <button herald-button variant="primary" type="button" [loading]="tournaments.isFetching()" (click)="tournaments.refetch()">Try again</button>
        </div>
      </section>
    } @else if (tournaments.data()!.length === 0) {
      <section class="panel" aria-labelledby="empty-heading">
        <herald-icon class="empty-icon" name="trophy" size="empty" />
        <h2 id="empty-heading">No tournaments yet</h2>
        <p>Create a draft with a title, complete it when you are ready, then publish it. Publishing does not open registration.</p>
        <div class="actions">
          <a herald-button variant="primary" routerLink="new">Create tournament</a>
        </div>
      </section>
    } @else {
      <ul class="tournaments">
        @for (tournament of tournaments.data(); track tournament.id) {
          <li>
            <div>
              <h2>{{ tournament.title }}</h2>
              <p class="facts">{{ facts(tournament) }}</p>
              @if (tournament.plannedStartAt) {
                <p class="facts">{{ dateTime(tournament.plannedStartAt) }} · {{ tournament.timeZone }}</p>
              }
              <p class="capacity">{{ capacityLine(tournament) }}</p>
              <p class="labels">
                @for (label of labels(tournament); track label.text) {
                  <herald-status-label [icon]="label.icon">{{ label.text }}</herald-status-label>
                }
              </p>
            </div>
            <!-- The row names the tournament; the accessible name keeps it for screen readers. -->
            <div class="row-actions">
              <a herald-button [routerLink]="tournament.id" [attr.aria-label]="action(tournament) + ': ' + tournament.title">{{ action(tournament) }}</a>
              @if (tournament.publication === 'published') {
                <a herald-button [routerLink]="[tournament.id, 'entries']" [attr.aria-label]="'Entries: ' + tournament.title"><herald-icon name="users" />Entries</a>
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--herald-space-4); margin-bottom: var(--herald-space-6); }
    h1 { font-size: 32px; margin-bottom: var(--herald-space-2); }
    .panel h2 { margin-top: 0; }
    .empty-icon { color: var(--herald-color-text-secondary); margin-bottom: var(--herald-space-2); }
    .tournaments { list-style: none; margin: 0; padding: 0; background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    li { display: flex; align-items: center; justify-content: space-between; gap: var(--herald-space-4); padding: var(--herald-space-6); }
    li + li { border-top: 1px solid var(--herald-color-border-default); }
    li h2 { font-size: 20px; margin: 0 0 var(--herald-space-2); }
    .facts { color: var(--herald-color-text-secondary); margin: 0 0 var(--herald-space-2); }
    .capacity { font-weight: 700; font-size: var(--herald-text-lg); margin: 0 0 var(--herald-space-3); }
    .labels { display: flex; flex-wrap: wrap; gap: var(--herald-space-2); margin: 0; }
    .row-actions { display: flex; flex: none; gap: var(--herald-space-3); }
    @media (max-width: 699px) {
      h1 { font-size: 28px; }
      .heading, li, .row-actions { flex-direction: column; align-items: stretch; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentListPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly organisationId = injectOrganisation();
  protected readonly organisation = injectWorkingOrganisation();
  protected readonly tournaments = injectQuery(() => ({
    queryKey: tournamentsKey(this.organisationId),
    queryFn: () => firstValueFrom(this.api.listTournaments(this.organisationId)),
    retry: false,
  }));

  protected readonly dateTime = dateTimeText;
  protected readonly labels = lifecycleLabels;

  protected facts(tournament: { gameVariant: string | null; entryKind: string | null; location: string | null; venue: string | null }): string {
    const kind = tournament.entryKind === 'team' ? 'Team' : tournament.entryKind === 'individual' ? 'Individual' : null;
    return [tournament.gameVariant, kind, locationText(tournament as never)].filter(Boolean).join(' · ') || 'Configuration not started';
  }

  /** A published tournament shows its admitted entries against the capacity; a draft only its capacity. */
  protected capacityLine(tournament: TournamentSummary): string {
    if (tournament.publication !== 'published') return `Capacity · ${capacityText(tournament)}`;
    const waiting = tournament.waitingEntries ? ` · ${tournament.waitingEntries} waiting` : '';
    return `${admittedText(tournament.admittedEntries, tournament)} admitted${waiting}`;
  }

  protected action(tournament: { publication: string }): string {
    return tournament.publication === 'published' ? 'Edit configuration' : 'Continue draft';
  }
}
