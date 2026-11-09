import { ChangeDetectionStrategy, Component, computed, DOCUMENT, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, NavigationError, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button, NavLink, Notice } from '@herald/ui';
import { AccessPage } from './access-page';
import { AccountMenu } from './account-menu';
import { AccessState, AppContext, AUTH_CONFIG, injectMe, injectWorkingOrganisation, Session } from './platform';

const deepest = (route: ActivatedRouteSnapshot): ActivatedRouteSnapshot => (route.firstChild ? deepest(route.firstChild) : route);

/** The organiser shell: graphite rail with the working context and navigation, and the page. */
@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Button, NavLink, Notice, AccessPage, AccountMenu],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly context = inject(AppContext);
  protected readonly access = inject(AccessState);
  protected readonly organisation = injectWorkingOrganisation();
  private readonly me = injectMe();
  protected readonly several = computed(() => (this.me.data()?.organisations.length ?? 0) > 1);
  protected readonly publicUrl = inject(AUTH_CONFIG).publicUrl;
  private readonly session = inject(Session);
  protected readonly signedIn = computed(() => this.session.account() !== null);
  /** Pages outside an organisation's workspace (creation) use the top bar instead of the rail. */
  protected readonly standalone = signal(false);
  private readonly location = inject(DOCUMENT).location;
  private readonly router = inject(Router);
  protected readonly replacedNoticeOpen = signal(this.context.replacedElsewhere());
  /** A lazy section that failed to load, usually because a new release replaced its files. */
  protected readonly failedUrl = signal<string | null>(null);
  private readonly failureHeading = viewChild<ElementRef<HTMLElement>>('failureHeading');

  constructor() {
    // The failure replaces the page, possibly with focus inside it: move focus to its heading so it is announced.
    effect(() => this.failureHeading()?.nativeElement.focus());
    this.router.events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationError) this.failedUrl.set(event.url);
        else if (event instanceof NavigationEnd) {
          this.failedUrl.set(null);
          this.standalone.set(deepest(this.router.routerState.snapshot.root).data['standalone'] === true);
        }
      });
  }

  /** A full load of the address that failed fetches the current release. */
  protected reload(url: string): void {
    this.location.assign(url);
  }
}
