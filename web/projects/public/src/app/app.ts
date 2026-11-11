import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Button, Icon, ToastOutlet } from '@herald/ui';
import { ORGANISER_WORKSPACE_URL } from './platform';

/** The public shell: graphite header with a menu disclosure on narrow screens, the page and a footer. */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button, Icon, ToastOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly workspaceUrl = inject(ORGANISER_WORKSPACE_URL);
  protected readonly menuOpen = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}
