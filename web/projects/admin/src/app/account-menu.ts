import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Icon } from '@herald/ui';
import { AppContext, Session } from './platform';

/** The signed-in person, the way back to their workspace, and sign-out; a disclosure closed with Escape. */
@Component({
  selector: 'app-account-menu',
  imports: [RouterLink, Button, Icon],
  host: { class: 'account', '(keydown.escape)': 'close()' },
  template: `
    <button #toggle type="button" class="account-toggle" aria-controls="account-panel" [attr.aria-expanded]="open()" (click)="open.set(!open())">
      {{ name() }}<span class="visually-hidden"> · Account</span>
      <herald-icon class="chevron" name="chevron-down" />
    </button>
    @if (open()) {
      <div class="account-panel" id="account-panel">
        <strong>{{ name() }}</strong>
        <small>Signed in with your account provider</small>
        @if (organise()) {
          <a herald-button [routerLink]="context.home()" (click)="close()">Organise</a>
        }
        <button herald-button type="button" (click)="signOut()">Sign out</button>
      </div>
    }
  `,
  styleUrl: './account-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenu {
  /** False where the person has no Herald access, such as an unassigned account. */
  readonly organise = input(true);
  protected readonly context = inject(AppContext);
  private readonly session = inject(Session);
  private readonly toggle = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  protected readonly open = signal(false);
  protected readonly name = computed(() => this.session.account()?.name || this.session.account()?.username || 'Your account');

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.toggle().nativeElement.focus();
  }

  protected signOut(): void {
    void this.context.signOut();
  }
}
