import { ChangeDetectionStrategy, Component, inject, RESPONSE_INIT } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@herald/ui';

/** Rendered by the server with status 404; it reveals nothing about unpublished tournaments. */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button],
  template: `
    <main class="not-found">
      <p class="eyebrow">Error 404</p>
      <h1>Page not found</h1>
      <p>The address may be mistyped, or the page may no longer be published.</p>
      <a herald-button variant="primary" routerLink="/">Go to the home page</a>
    </main>
  `,
  styles: `
    .not-found { max-width: 65ch; padding: var(--herald-space-16) max(5vw, 24px); }
    .eyebrow { margin-bottom: var(--herald-space-2); color: var(--herald-color-text-secondary); font-size: var(--herald-text-sm); font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
    h1 { font-size: 40px; }
    p { font-size: var(--herald-text-lg); margin-bottom: var(--herald-space-6); }
    @media (max-width: 700px) { .not-found { padding: var(--herald-space-12) var(--herald-space-4); } h1 { font-size: 32px; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  constructor() {
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) response.status = 404;
  }
}
