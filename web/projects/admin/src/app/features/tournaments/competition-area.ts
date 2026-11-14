import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { Button, IconName, Notice, StatusLabel, StatusTone } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState, CONFIRM } from '../../platform';
import { instantText } from './tournaments';

interface Condition {
  rule: string;
  met: boolean;
  title: string;
  help: string;
  /** The page that fixes it, relative to the configuration page; none when it is fixed on this page. */
  fix: { link: string; text: string } | null;
}

/** A team's name as a possessive: “Granite Herons’ roster”, “North Stars’ roster”, “Team A’s roster”. */
const possessive = (name: string): string => (name.endsWith('s') ? `${name}’` : `${name}’s`);

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

/** Start readiness and start (CP-04, §5.1 row 6): its own operation area after Registration. */
@Component({
  selector: 'app-competition-area',
  imports: [Button, Notice, RouterLink, StatusLabel],
  template: `
    <section class="area" aria-labelledby="competition-heading" [attr.aria-busy]="state() === 'busy'">
      <h2 id="competition-heading">Competition</h2>
      <p class="badge"><herald-status-label id="competition-state" [tone]="badge().tone" [icon]="badge().icon">{{ badge().text }}</herald-status-label></p>
      @if (running()) {
        <p>{{ startedText() }}</p>
        <p class="help">{{ fixedText() }}</p>
        @for (roster of crossed(); track roster.entryId) {
          <herald-notice tone="danger" heading="A roster changed during the start">
            {{ possessive(roster.teamName) }} frozen roster has {{ roster.members }} players ({{ bound(roster.members) }}). Nothing was repaired; resolve it from the round operations.
          </herald-notice>
        }
      } @else {
        <ul class="checks" aria-label="Conditions to start">
          @for (condition of conditions(); track condition.rule) {
            <li>
              <div>
                <strong>{{ condition.title }}</strong>
                <p class="help">
                  {{ condition.help }}
                  @if (!condition.met && condition.fix; as fix) {
                    <a [routerLink]="fix.link">{{ fix.text }}</a>
                  }
                </p>
              </div>
              <herald-status-label [tone]="condition.met ? 'success' : 'danger'" [icon]="condition.met ? 'circle-check' : 'alert-circle'">
                {{ condition.met ? 'Met' : 'Not met' }}
              </herald-status-label>
            </li>
          }
        </ul>
        @for (shared of tournament().start.sharedMemberNames; track shared.name) {
          <p class="help">Warning, not a blocker: {{ shared.teamNames.join(' and ') }} both have a member named “{{ shared.name }}”.</p>
        }
        @if (state() === 'busy') {
          <p class="help" role="status">Starting. Please wait; do not submit again.</p>
        }
        @if (state() === 'failed') {
          <herald-notice tone="danger" heading="The competition did not start">The request failed. Competition is still preparing. Try starting it again.</herald-notice>
        }
        @if (state() === 'conflict') {
          <herald-notice tone="danger" heading="This tournament changed elsewhere">
            Nothing changed with this request. Reload the latest readiness before starting.
            <span class="notice-action"><button herald-button type="button" (click)="reload.emit()">Reload latest</button></span>
          </herald-notice>
        }
        <button
          herald-button
          variant="primary"
          type="button"
          [loading]="state() === 'busy'"
          [disabled]="!!reason()"
          [attr.aria-describedby]="reason() ? 'competition-state' : null"
          (click)="start()"
        >
          {{ state() === 'busy' ? 'Starting…' : 'Start competition' }}
        </button>
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    .area { padding: var(--herald-space-6); background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    h2 { font-size: 20px; margin: 0 0 var(--herald-space-2); }
    .badge { margin: 0 0 var(--herald-space-4); }
    /* A blocker sentence can be longer than a phone is wide. */
    .badge herald-status-label { white-space: normal; }
    p { margin: 0 0 var(--herald-space-4); }
    .help { color: var(--herald-color-text-secondary); max-inline-size: 75ch; }
    .checks { list-style: none; margin: 0 0 var(--herald-space-4); padding: 0; }
    .checks li { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--herald-space-4); padding: var(--herald-space-3) 0; }
    .checks li + li { border-top: 1px solid var(--herald-color-border-default); }
    .checks .help { margin: var(--herald-space-1) 0 0; }
    .checks a { color: inherit; margin-left: var(--herald-space-1); }
    herald-notice { display: flex; margin-bottom: var(--herald-space-4); }
    .notice-action { display: block; margin-top: var(--herald-space-3); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompetitionArea {
  private readonly api = inject(HeraldHostAdminService);
  private readonly access = inject(AccessState);
  private readonly confirm = inject(CONFIRM);

  readonly organisation = input.required<string>();
  readonly tournament = input.required<TournamentDetails>();
  /** The configuration form has unsaved changes. */
  readonly unsaved = input(false);
  readonly changed = output<TournamentDetails>();
  readonly reload = output<void>();

  protected readonly state = signal<'ready' | 'busy' | 'failed' | 'conflict'>('ready');
  protected readonly running = computed(() => this.tournament().competition === 'running');
  private readonly team = computed(() => this.tournament().configuration.entryKind === 'team');
  private readonly zone = computed(() => this.tournament().configuration.timeZone ?? 'UTC');

  protected readonly conditions = computed<Condition[]>(() => {
    const { start, configuration } = this.tournament();
    return start.conditions.map(({ rule, met }) => {
      const ok = !!met;
      switch (rule) {
        case 'registration-closed':
          return { rule, met: ok, title: 'Registration closed', help: ok ? 'Closed.' : 'Close registration above.', fix: null };
        case 'no-pending-check-in':
          return {
            rule: rule,
            met: ok,
            title: 'No entry pending check-in',
            help: start.pending === null ? 'Not reported yet.' : ok ? 'Every admitted entry is checked in or needs no check-in.' : `${plural(start.pending, 'entry', 'entries')} pending. Check them in or mark them absent.`,
            fix: { link: 'entries', text: 'Open entries' },
          };
        case 'two-eligible':
          return {
            rule,
            met: ok,
            title: 'At least two eligible entrants',
            help: start.eligible === null ? 'Not reported yet.' : `${start.eligible} eligible.`,
            fix: { link: 'entries', text: 'Open entries' },
          };
        case 'schedule-current':
          return {
            rule,
            met: ok,
            title: 'Schedule published and current',
            help:
              start.publishedScheduleRevision === null
                ? 'No schedule published.'
                : ok
                  ? `Revision ${start.publishedScheduleRevision}, built from the current field.`
                  : `Revision ${start.publishedScheduleRevision} was built from an older field. Withdraw it and publish again.`,
            fix: { link: 'schedule', text: 'Open schedule' },
          };
        default: {
          const outside = start.rostersOutsideBounds;
          return {
            rule: rule!,
            met: ok,
            title: `Rosters within ${configuration.minimumRosterSize}–${configuration.maximumRosterSize} players`,
            help:
              outside === null
                ? 'Not reported yet.'
                : ok
                  ? 'Every admitted team.'
                  : outside.map((team) => `${team.teamName} has ${plural(team.members, 'player', 'players')} (${this.bound(team.members)}).`).join(' '),
            fix: { link: 'entries', text: 'Open entries' },
          };
        }
      }
    });
  });

  private readonly firstUnmet = computed(() => this.conditions().find((condition) => !condition.met) ?? null);

  protected readonly badge = computed<{ text: string; tone: StatusTone; icon: IconName }>(() => {
    if (this.running()) return { text: 'Running', tone: 'success', icon: 'trophy' };
    if (this.state() === 'busy') return { text: 'Starting', tone: 'info', icon: 'hourglass' };
    const unmet = this.firstUnmet();
    if (!unmet) return { text: 'Ready to start', tone: 'success', icon: 'circle-check' };
    return { text: this.blockedText(unmet), tone: 'danger', icon: 'alert-circle' };
  });

  /** Why Start is unavailable, or null when it is; the badge says it to the person. */
  protected readonly reason = computed(() => {
    if (this.state() === 'busy') return 'Request in progress.';
    if (this.state() === 'conflict') return 'Reload the latest readiness first.';
    if (this.unsaved()) return 'Save your changes first.';
    return this.firstUnmet() ? this.blockedText(this.firstUnmet()!) : null;
  });

  protected readonly startedText = computed(() => {
    const startedAt = this.tournament().start.startedAt;
    return startedAt ? `Started ${instantText(startedAt, this.zone())} · ${this.zone()}` : 'Started';
  });

  protected readonly fixedText = computed(() => {
    const { start } = this.tournament();
    const rosters = this.team() ? ', team rosters' : '';
    return `Fixed at start: ${plural(start.eligible ?? 0, 'entrant', 'entrants')}, schedule revision ${start.startedOnScheduleRevision}${rosters}. No match has started.`;
  });

  /** Frozen rosters outside their bounds: a roster write crossed the start (design D-4). */
  protected readonly crossed = computed(() => (this.running() && this.team() ? (this.tournament().start.rostersOutsideBounds ?? []) : []));

  constructor() {
    // A tournament loaded again starts from its own state, not from this area's last failure.
    effect(() => {
      this.tournament();
      this.state.set('ready');
    });
  }

  protected readonly possessive = possessive;

  protected bound(members: number): string {
    const { minimumRosterSize, maximumRosterSize } = this.tournament().configuration;
    return members < (minimumRosterSize ?? 0) ? `minimum ${minimumRosterSize}` : `maximum ${maximumRosterSize}`;
  }

  protected async start(): Promise<void> {
    if (this.reason()) return;
    const { id, revision, start } = this.tournament();
    const rosters = this.team() ? ' and the team rosters' : '';
    const confirmed = await this.confirm({
      heading: 'Start the competition?',
      body: `Start fixes the ${plural(start.eligible ?? 0, 'entrant', 'entrants')}, schedule revision ${start.publishedScheduleRevision}${rosters}. It cannot be undone. No match starts by itself.`,
      confirmLabel: 'Start competition',
      leaveLabel: 'Keep preparing',
    });
    if (!confirmed) return;
    this.state.set('busy');
    try {
      this.changed.emit(await firstValueFrom(this.api.startCompetition(this.organisation(), id, { expectedRevision: revision })));
    } catch (error) {
      // Lost access shows its own state; nothing to add here.
      if (this.access.problem()) return;
      // A condition no longer met (400) also means the readiness on screen is out of date.
      this.state.set(error instanceof HttpErrorResponse && (error.status === 409 || error.status === 400) ? 'conflict' : 'failed');
    }
  }

  private blockedText(condition: Condition): string {
    const { start } = this.tournament();
    switch (condition.rule) {
      case 'registration-closed':
        return 'Registration is still open';
      case 'no-pending-check-in':
        return start.pending ? `${plural(start.pending, 'entry', 'entries')} pending check-in` : 'Check-ins not reported yet';
      case 'two-eligible':
        return 'Fewer than two eligible entrants';
      case 'schedule-current':
        return start.publishedScheduleRevision === null ? 'No schedule published' : 'The schedule is not current';
      default: {
        const [first] = start.rostersOutsideBounds ?? [];
        if (!first) return 'Rosters not reported yet';
        return `${possessive(first.teamName)} roster is ${first.members < (this.tournament().configuration.minimumRosterSize ?? 0) ? 'below the minimum' : 'above the maximum'}`;
      }
    }
  }
}
