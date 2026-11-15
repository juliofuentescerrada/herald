import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** The tournament's sections below its title: route links, the current one marked as the page (visual direction §7). */
@Component({
  selector: 'app-tournament-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Tournament">
      @for (tab of tabs; track tab.path) {
        <a [routerLink]="base() + tab.path" routerLinkActive="current" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{ exact: true }">{{ tab.text }}</a>
      }
    </nav>
  `,
  styles: `
    nav { display: flex; flex-wrap: wrap; gap: var(--herald-space-4); border-bottom: 1px solid var(--herald-color-border-default); }
    a { display: inline-flex; align-items: center; min-height: var(--herald-target-min); color: var(--herald-color-text-secondary); text-decoration: none; border-bottom: 3px solid transparent; }
    a.current { color: var(--herald-color-text-primary); font-weight: 700; border-bottom-color: var(--herald-color-text-primary); }
    a:hover { color: var(--herald-color-text-primary); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentTabs {
  readonly organisation = input.required<string>();
  readonly tournament = input.required<string>();

  protected readonly base = () => `/organisations/${this.organisation()}/tournaments/${this.tournament()}`;
  protected readonly tabs = [
    { path: '', text: 'Configuration' },
    { path: '/entries', text: 'Entries' },
    { path: '/schedule', text: 'Schedule' },
    { path: '/standings', text: 'Standings' },
  ] as const;
}
