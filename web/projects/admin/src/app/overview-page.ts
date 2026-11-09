import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button, Notice } from '@herald/ui';
import { injectWorkingOrganisation } from './platform';

/** The organisation workspace's landing page. Tournaments and next actions arrive with H1 features. */
@Component({
  selector: 'app-overview-page',
  imports: [Button, Notice, RouterLink],
  template: `
    @if (created() && organisation.data(); as summary) {
      <herald-notice class="created" tone="success" heading="Organisation created" dismissible (dismissed)="created.set(false)">
        You are now the only owner of {{ summary.name }}.
      </herald-notice>
    }
    <h1>Overview</h1>
    <p class="lead">{{ organisation.data()?.name }} · your organisation</p>
    <div class="actions">
      <a herald-button routerLink="/organisations/new">Create another organisation</a>
    </div>
  `,
  styles: `
    h1 { font-size: 32px; margin-bottom: var(--herald-space-2); }
    .created { display: flex; margin-bottom: var(--herald-space-6); max-width: 800px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage {
  protected readonly organisation = injectWorkingOrganisation();
  /** Set by creation's full load (`?created`); shown once, then dropped from the address. */
  protected readonly created = signal(inject(ActivatedRoute).snapshot.queryParamMap.has('created'));

  constructor() {
    if (this.created()) void inject(Router).navigate([], { queryParams: {}, replaceUrl: true });
  }
}
