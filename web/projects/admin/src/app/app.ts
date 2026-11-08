import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationError, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button, NavLink, Notice } from '@herald/ui';
import { AppContext } from './platform';

/** The organiser shell: graphite rail with the working context and navigation, and the page. */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button, NavLink, Notice],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly context = inject(AppContext);
  private readonly location = inject(DOCUMENT).location;
  protected readonly replacedNoticeOpen = signal(this.context.replacedElsewhere());
  /** A lazy section that failed to load, usually because a new release replaced its files. */
  protected readonly failedUrl = signal<string | null>(null);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationError) this.failedUrl.set(event.url);
        else if (event instanceof NavigationEnd) this.failedUrl.set(null);
      });
  }

  /** A full load of the address that failed fetches the current release. */
  protected reload(url: string): void {
    this.location.assign(url);
  }
}
