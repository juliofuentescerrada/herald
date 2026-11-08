import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Notice } from '@herald/ui';

type Attempt = 'idle' | 'sending' | 'failed' | 'done';

/**
 * Error and recovery with the shared controls: the first attempt fails, the retry succeeds,
 * and what was entered survives both. Nothing is sent anywhere.
 */
@Component({
  selector: 'app-recovery-demo',
  imports: [Button, Notice],
  template: `
    <label for="recovery-name">Tournament name</label>
    <input id="recovery-name" [value]="name()" (input)="name.set($any($event.target).value)" />
    <p>
      <button herald-button variant="primary" [loading]="attempt() === 'sending'" (click)="publish()">
        {{ attempt() === 'sending' ? 'Publishing…' : 'Publish' }}
      </button>
    </p>
    @switch (attempt()) {
      @case ('sending') {
        <p role="status">Publishing the tournament.</p>
      }
      @case ('failed') {
        <herald-notice tone="danger" heading="The tournament could not be published.">
          <p>Herald could not reach the server. Your entry was kept; try again.</p>
        </herald-notice>
      }
      @case ('done') {
        <herald-notice tone="success" heading="Published.">“{{ name() }}” is published.</herald-notice>
      }
    }
  `,
  styles: `
    :host { display: grid; gap: var(--herald-space-2); max-width: 420px; }
    label { font-weight: 600; }
    input { min-height: var(--herald-target-min); padding: var(--herald-space-2) var(--herald-space-3);
      border: 1px solid var(--herald-color-border-control); border-radius: var(--herald-radius-default); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryDemo {
  protected readonly name = signal('Spring league');
  protected readonly attempt = signal<Attempt>('idle');
  private failures = 1;

  protected publish() {
    this.attempt.set('sending');
    setTimeout(() => this.attempt.set(this.failures-- > 0 ? 'failed' : 'done'), 600);
  }
}
