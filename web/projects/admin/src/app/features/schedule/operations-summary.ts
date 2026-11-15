import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScheduleDetails } from '@herald/api-client/admin';
import { Notice, StatusLabel } from '@herald/ui';
import { possessive } from '../../shared';
import { roundStateLabel } from './schedule';

/** Where a running competition stands: match counts, each round's state and what needs attention (h1-round-operations D-5). */
@Component({
  selector: 'app-operations-summary',
  imports: [Notice, RouterLink, StatusLabel],
  template: `
    @let ops = schedule().operations!;
    <section class="operations" aria-labelledby="operations-heading">
      <h2 id="operations-heading">Operations</h2>
      <p class="stats">
        <herald-status-label tone="neutral">{{ ops.scheduled }} scheduled</herald-status-label>
        <herald-status-label tone="info">{{ ops.inPlay }} in play</herald-status-label>
        <herald-status-label tone="success">{{ ops.resolved }} of {{ schedule().matches.length }} resolved</herald-status-label>
      </p>
      <ul class="rounds" aria-label="Rounds">
        @for (round of ops.rounds; track round.number) {
          @let label = roundStateLabel[round.state];
          <li><span>Round {{ round.number }}</span><herald-status-label [tone]="label.tone" [icon]="label.icon">{{ label.text }}</herald-status-label></li>
        }
      </ul>
      @if (attention().length) {
        <h3 id="attention-heading">Needs attention</h3>
        <ul class="attention" aria-labelledby="attention-heading">
          @for (item of attention(); track item.key) {
            <li>
              <div>
                <strong><a [routerLink]="['../matches', item.matchId]">{{ item.title }}</a></strong>
                <p class="help">{{ item.text }}</p>
              </div>
              <herald-status-label tone="danger" icon="alert-triangle">Blocked</herald-status-label>
            </li>
          }
        </ul>
      }
      @if (noActive()) {
        <herald-notice heading="No active entrant">
          Every remaining match was resolved by the departures. The competition stays running until it is finalised; no active champion will be declared.
        </herald-notice>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .operations { padding: var(--herald-space-6); background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    h2 { font-size: 20px; margin: 0 0 var(--herald-space-3); }
    h3 { font-size: 16px; margin: var(--herald-space-4) 0 var(--herald-space-2); }
    .help { color: var(--herald-color-text-secondary); margin: var(--herald-space-1) 0 0; max-inline-size: 75ch; }
    .stats { display: flex; flex-wrap: wrap; gap: var(--herald-space-2); margin: 0 0 var(--herald-space-4); }
    .rounds { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--herald-space-2) var(--herald-space-6); }
    .rounds li { display: inline-flex; align-items: center; gap: var(--herald-space-2); }
    .attention { list-style: none; margin: 0; padding: 0; }
    .attention li { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--herald-space-4); padding: var(--herald-space-3) 0; }
    .attention li + li { border-top: 1px solid var(--herald-color-border-default); }
    .attention a { color: inherit; }
    herald-notice { display: flex; margin-top: var(--herald-space-4); }
    @media (max-width: 699px) { .operations { padding: var(--herald-space-4); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsSummary {
  readonly schedule = input.required<ScheduleDetails>();

  protected readonly roundStateLabel = roundStateLabel;
  protected readonly attention = computed(() =>
    (this.schedule().operations?.attention ?? []).map((item) => {
      const match = this.schedule().matches.find((other) => other.matchId === item.matchId);
      return {
        key: `${item.matchId}-${item.player.playerId}`,
        matchId: item.matchId,
        title: `Round ${item.round} · ${match?.first.name} vs ${match?.second.name}`,
        text: `${possessive(item.entrant.name)} lineup includes ${item.player.name}, who is unavailable. Revise the lineup before starting.`,
      };
    }),
  );
  protected readonly noActive = computed(() => this.schedule().entrants.length > 0 && this.schedule().entrants.every((entrant) => entrant.status !== 'active'));
}
