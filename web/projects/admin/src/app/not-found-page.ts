import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@herald/ui';
import { AppContext } from './platform';

/** Generic on purpose: it never confirms that an address exists in another organisation. */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button],
  template: `
    <section class="not-found" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading">Page not found{{ context.organisation() ? ' in ' + context.organisation() : '' }}</h1>
      <p>It may have been removed, or it may belong to an organisation you are not working in.</p>
      <a herald-button variant="primary" routerLink="/">Go to overview</a>
    </section>
  `,
  styles: `
    .not-found { max-width: 720px; padding: var(--herald-space-8); background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    h1 { font-size: 32px; margin-bottom: var(--herald-space-3); }
    p { font-size: var(--herald-text-lg); margin: 0 0 var(--herald-space-6); }
    @media (max-width: 700px) { .not-found { padding: var(--herald-space-6) var(--herald-space-4); } h1 { font-size: 28px; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected readonly context = inject(AppContext);
}
