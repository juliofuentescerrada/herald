import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@herald/ui';
import { AppContext, injectMe, organisationPath } from '../../platform';

/** The person's organisations; switching opens the other one as a new document, never combining them. */
@Component({
  selector: 'app-organisation-selector-page',
  imports: [Button, RouterLink],
  template: `
    <h1>Choose an organisation</h1>
    <p class="lead">You own these organisations. Switching replaces the workspace; permissions are never combined.</p>
    <section class="panel" aria-labelledby="your-organisations">
      <h2 id="your-organisations">Your organisations</h2>
      @if (me.isPending()) {
        <p role="status">Loading your organisations…</p>
      } @else {
        <ul class="organisations">
          @for (organisation of organisations(); track organisation.id) {
            <li>
              <div>
                <strong>{{ organisation.name }}</strong>
                <small>Owner{{ organisation.current ? ' · Current organisation' : '' }}</small>
              </div>
              @if (organisation.current) {
                <span>Selected</span>
              } @else {
                <!-- The row names the organisation; the accessible name keeps it for screen readers. -->
                <button herald-button type="button" [attr.aria-label]="'Switch to ' + organisation.name" (click)="switchTo(organisation.id)">Switch</button>
              }
            </li>
          }
        </ul>
      }
      <div class="actions">
        <a herald-button routerLink="/organisations/new">Create another organisation</a>
        @if (context.organisation()) {
          <a herald-button [routerLink]="context.home()">Keep current organisation</a>
        }
      </div>
    </section>
  `,
  styles: `
    h1 { font-size: 32px; margin-bottom: var(--herald-space-2); }
    .panel { max-width: 800px; margin-top: var(--herald-space-6); }
    .panel h2 { margin-top: 0; }
    .organisations { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; justify-content: space-between; gap: var(--herald-space-4); padding: var(--herald-space-4) 0; border-top: 1px solid var(--herald-color-border-default); font-size: var(--herald-text-lg); }
    li div { display: flex; flex-direction: column; }
    small { color: var(--herald-color-text-secondary); font-size: var(--herald-text-base); }
    @media (max-width: 700px) { h1 { font-size: 28px; } li { flex-direction: column; align-items: stretch; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationSelectorPage {
  protected readonly context = inject(AppContext);
  protected readonly me = injectMe();
  protected readonly organisations = computed(() =>
    (this.me.data()?.organisations ?? []).map((o) => ({ ...o, current: o.id.toLowerCase() === this.context.organisation() })),
  );

  /** A full load of the other workspace; leaving this one with unsaved input was confirmed on the way here. */
  protected switchTo(id: string): void {
    this.context.enter(organisationPath(id));
  }
}
