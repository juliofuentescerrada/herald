import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppContext } from './platform';

/** The workspace landing page. Tournaments and next actions arrive with H1 features. */
@Component({
  selector: 'app-overview-page',
  template: `
    <h1>Overview</h1>
    @if (context.organisation(); as organisation) {
      <p class="lead">{{ organisation }}'s tournaments and next actions appear here.</p>
    } @else {
      <p class="lead">No organisation is selected. Choosing or creating one arrives with organisation set-up in H1.</p>
    }
  `,
  styles: `
    h1 { font-size: 32px; margin-bottom: var(--herald-space-2); }
    .lead { color: var(--herald-color-text-secondary); font-size: var(--herald-text-lg); max-width: 65ch; margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage {
  protected readonly context = inject(AppContext);
}
