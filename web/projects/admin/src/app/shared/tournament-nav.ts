import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

/** Peer routes of an existing published tournament; links retain normal route guards. */
@Component({
  selector: 'app-tournament-nav',
  imports: [RouterLink],
  template: `<nav aria-label="Tournament sections">
    @for (section of sections; track section.path) {
      <a [routerLink]="base() + '/' + section.path" [attr.aria-current]="current() === section.name ? 'page' : null">{{ section.name }}</a>
    }
  </nav>`,
  styles: `nav { display: flex; flex-wrap: wrap; gap: var(--herald-space-2) var(--herald-space-6); border-bottom: 1px solid var(--herald-color-border-default); margin-bottom: var(--herald-space-6); }
    a { color: var(--herald-color-text-primary); display: inline-flex; align-items: center; min-height: var(--herald-target-min); padding: var(--herald-space-3) 0; text-decoration: none; }
    a[aria-current] { border-bottom: 3px solid var(--herald-color-text-primary); font-weight: 700; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentNav {
  readonly current = input.required<'Configuration' | 'Entries' | 'Schedule'>();
  private readonly organisation = inject(ActivatedRoute).snapshot.paramMap.get('organisationId')!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;
  protected readonly base = computed(() => `/organisations/${this.organisation}/tournaments/${this.tournamentId}`);
  protected readonly sections = [{ name: 'Configuration', path: '' }, { name: 'Entries', path: 'entries' }, { name: 'Schedule', path: 'schedule' }] as const;
}
