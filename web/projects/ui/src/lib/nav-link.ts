import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { Icon, IconName } from './icon';

/**
 * A navigation link on a graphite shell surface. The app marks the current page with
 * `aria-current="page"` (for example with `ariaCurrentWhenActive`); ui knows no routes.
 */
@Component({
  selector: 'a[herald-nav-link]',
  imports: [Icon],
  host: { class: 'herald-nav-link' },
  template: `@if (icon(); as name) {<herald-icon [name]="name" size="navigation" />}<ng-content />`,
  styles: `
    .herald-nav-link {
      display: flex;
      align-items: center;
      gap: var(--herald-space-2);
      min-height: var(--herald-target-min);
      padding: var(--herald-space-3);
      border-left: 3px solid transparent;
      border-radius: var(--herald-radius-default);
      color: var(--herald-color-text-inverse-secondary);
      text-decoration: none;
    }
    .herald-nav-link:hover { color: var(--herald-color-text-inverse); text-decoration: underline; text-underline-offset: 6px; }
    .herald-nav-link:focus-visible { outline: 3px solid var(--herald-color-focus-ring-inverse); outline-offset: -3px; }
    .herald-nav-link[aria-current='page'] {
      border-left-color: var(--herald-color-brand-accent);
      background: var(--herald-color-surface-inverse-raised);
      color: var(--herald-color-text-inverse);
      font-weight: 600;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavLink {
  /** Decorative: the link's text stays its name. */
  readonly icon = input<IconName>();
}
