import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectWorkingOrganisation } from './platform';

/** The organisation workspace's landing page. Tournaments and next actions arrive with H1 features. */
@Component({
  selector: 'app-overview-page',
  template: `
    <h1>Overview</h1>
    <p class="lead">{{ organisation.data()?.name }}'s tournaments and next actions appear here.</p>
  `,
  styles: `
    h1 { font-size: 32px; margin-bottom: var(--herald-space-2); }
    .lead { color: var(--herald-color-text-secondary); font-size: var(--herald-text-lg); max-width: 65ch; margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage {
  protected readonly organisation = injectWorkingOrganisation();
}
