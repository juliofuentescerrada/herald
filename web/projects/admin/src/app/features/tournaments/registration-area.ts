import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DOCUMENT, effect, inject, input, output, signal } from '@angular/core';
import { HeraldHostAdminService, TournamentDetails } from '@herald/api-client/admin';
import { Button, Notice } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState } from '../../platform';
import { dateTimeText, fieldLabels, instantText, registrationText } from './tournaments';

/** Opens, closes and reopens registration: its own operation area, separate from saving the configuration. */
@Component({
  selector: 'app-registration-area',
  imports: [Button, Notice],
  template: `
    <section class="area" aria-labelledby="registration-heading" [attr.aria-busy]="state() === 'busy'">
      <h2 id="registration-heading">Registration</h2>
      <p class="state">{{ stateText() }}</p>
      <dl>
        <div>
          <dt>Announced opening</dt>
          <dd>{{ announced(tournament().configuration.registrationOpensAt) }}</dd>
        </div>
        <div>
          <dt>Announced closure</dt>
          <dd>{{ announced(tournament().configuration.registrationClosesAt) }}</dd>
        </div>
        <div class="wide">
          <dt>Reference time zone</dt>
          <dd>{{ tournament().configuration.timeZone }}</dd>
        </div>
      </dl>
      <p class="help">These dates are an announcement. Registration changes only with the action below, not automatically at these times.</p>
      @if (lastChange(); as change) {
        <p class="last">{{ change }}</p>
      }
      @if (state() === 'failed') {
        <herald-notice tone="danger" [heading]="failedHeading()">The request failed. {{ failedText() }}</herald-notice>
      }
      @if (state() === 'conflict') {
        <herald-notice tone="danger" heading="This tournament changed elsewhere">
          Nothing was changed by this request. Everything you typed is kept below. Copy what you need, then reload the latest version.
          <span class="notice-action"><button herald-button type="button" (click)="reload.emit()">Reload latest</button></span>
        </herald-notice>
      }
      @if (missing().length && !isOpen()) {
        <ul>
          @for (name of missing(); track name) {
            <li><a [href]="'#t-' + name" (click)="focus($event, name)">Set {{ label(name) }}</a></li>
          }
        </ul>
      }
      @if (reason(); as why) {
        <p class="help" id="registration-reason">{{ why }}</p>
      }
      <button herald-button variant="primary" type="button" [loading]="state() === 'busy'" [disabled]="!!reason()" [attr.aria-describedby]="reason() ? 'registration-reason' : null" (click)="change()">
        {{ actionText() }}
      </button>
    </section>
  `,
  styles: `
    :host { display: block; }
    .area { padding: var(--herald-space-6); background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    h2 { font-size: 20px; margin: 0 0 var(--herald-space-2); }
    .state { font-weight: 700; margin: 0 0 var(--herald-space-4); }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: var(--herald-space-4); margin: 0 0 var(--herald-space-4); }
    dt { color: var(--herald-color-text-secondary); margin-bottom: var(--herald-space-1); }
    dd { margin: 0; }
    .wide { grid-column: 1 / -1; }
    .help { color: var(--herald-color-text-secondary); margin: 0 0 var(--herald-space-4); max-inline-size: 75ch; }
    .last { margin: 0 0 var(--herald-space-4); }
    herald-notice { display: flex; margin-bottom: var(--herald-space-4); }
    .notice-action { display: block; margin-top: var(--herald-space-3); }
    ul { margin: 0 0 var(--herald-space-4); padding-left: var(--herald-space-6); }
    li { padding: var(--herald-space-1) 0; }
    a { color: inherit; }
    @media (max-width: 700px) { dl { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationArea {
  private readonly api = inject(HeraldHostAdminService);
  private readonly access = inject(AccessState);
  private readonly document = inject(DOCUMENT);

  readonly organisation = input.required<string>();
  readonly tournament = input.required<TournamentDetails>();
  /** The configuration form has unsaved changes. */
  readonly unsaved = input(false);
  readonly changed = output<TournamentDetails>();
  readonly reload = output<void>();

  protected readonly state = signal<'ready' | 'busy' | 'failed' | 'conflict'>('ready');
  protected readonly isOpen = computed(() => this.tournament().registration === 'open');
  protected readonly stateText = computed(() => registrationText(this.tournament().registration));
  protected readonly missing = computed(() => this.tournament().missingForRegistration);
  protected readonly actionText = computed(() => {
    const busy = this.state() === 'busy';
    if (this.isOpen()) return busy ? 'Closing registration…' : 'Close registration';
    if (busy) return 'Opening registration…';
    return this.tournament().registration === 'closed' ? 'Reopen registration' : 'Open registration';
  });
  protected readonly failedHeading = computed(() => (this.isOpen() ? 'Registration was not closed' : 'Registration was not opened'));
  protected readonly failedText = computed(() => {
    if (this.isOpen()) return 'Registration is still open. Try closing it again.';
    return this.tournament().registration === 'closed' ? 'Registration is still closed. Try reopening it again.' : 'Registration is still not open. Try opening it again.';
  });
  /** Why the action is unavailable, or null when it is. */
  protected readonly reason = computed(() => {
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest version first.';
    if (this.unsaved()) return 'Save your changes first.';
    return !this.isOpen() && this.missing().length ? 'Set both registration dates before opening registration.' : null;
  });
  protected readonly lastChange = computed(() => {
    const { registration, registrationChangedAt, configuration } = this.tournament();
    if (!registrationChangedAt || registration === 'notOpen') return null;
    const zone = configuration.timeZone ?? 'UTC';
    return `${registration === 'open' ? 'Opened' : 'Closed'} ${instantText(registrationChangedAt, zone)} · ${zone}`;
  });

  constructor() {
    // A tournament loaded again starts from its own state, not from this area's last failure.
    effect(() => {
      this.tournament();
      this.state.set('ready');
    });
  }

  protected announced(local: string | null | undefined): string {
    return dateTimeText(local) || 'Not set';
  }

  protected label(name: string): string {
    return (fieldLabels[name] ?? name).toLowerCase();
  }

  protected focus(event: Event, name: string): void {
    event.preventDefault();
    this.document.getElementById(`t-${name}`)?.focus();
  }

  protected async change(): Promise<void> {
    if (this.reason()) return;
    const { id, revision } = this.tournament();
    const close = this.isOpen();
    this.state.set('busy');
    try {
      const body = { expectedRevision: revision };
      const answer = await firstValueFrom(
        close ? this.api.closeRegistration(this.organisation(), id, body) : this.api.openRegistration(this.organisation(), id, body),
      );
      this.changed.emit(answer);
    } catch (error) {
      // Lost access shows its own state; nothing to add here.
      if (this.access.problem()) return;
      this.state.set(error instanceof HttpErrorResponse && error.status === 409 ? 'conflict' : 'failed');
    }
  }
}
