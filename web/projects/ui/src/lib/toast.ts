import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Icon } from './icon';

export type ToastTone = 'success' | 'info';

export interface Toast {
  readonly id: number;
  readonly text: string;
  readonly tone: ToastTone;
}

/** At least five seconds (design A-2); paused while hovered or focused. */
export const toastDuration = 6000;
const maxToasts = 3;

interface Timer {
  remaining: number;
  started: number;
  handle?: ReturnType<typeof setTimeout>;
}

/**
 * Announces the outcome of the person's own completed action. Never an error: errors stay where
 * they arose (visual direction §5). Nothing is shown on the server.
 */
@Injectable({ providedIn: 'root' })
export class Toasts {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly timers = new Map<number, Timer>();
  private nextId = 1;
  private readonly list = signal<readonly Toast[]>([]);
  /** Oldest first. */
  readonly toasts = this.list.asReadonly();

  show(text: string, tone: ToastTone = 'success'): void {
    if (!this.browser) return;
    const toast: Toast = { id: this.nextId++, text, tone };
    const kept = [...this.list(), toast];
    for (const old of kept.slice(0, -maxToasts)) this.stop(old.id);
    this.list.set(kept.slice(-maxToasts));
    this.timers.set(toast.id, { remaining: toastDuration, started: 0 });
    this.resume(toast.id);
  }

  dismiss(id: number): void {
    this.stop(id);
    this.list.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  /** Removes every toast, for example when the organisation or the person changes. */
  clear(): void {
    for (const toast of this.list()) this.stop(toast.id);
    this.list.set([]);
  }

  pause(id: number): void {
    const timer = this.timers.get(id);
    if (!timer?.handle) return;
    clearTimeout(timer.handle);
    timer.handle = undefined;
    timer.remaining -= Date.now() - timer.started;
  }

  resume(id: number): void {
    const timer = this.timers.get(id);
    if (!timer || timer.handle) return;
    timer.started = Date.now();
    timer.handle = setTimeout(() => this.dismiss(id), Math.max(timer.remaining, 0));
  }

  private stop(id: number): void {
    clearTimeout(this.timers.get(id)?.handle);
    this.timers.delete(id);
  }
}

/**
 * The one toast stack of a shell: bottom right on a wide screen, along the bottom of a narrow one.
 * The live region exists before any toast, so additions are announced politely.
 */
@Component({
  selector: 'herald-toast-outlet',
  imports: [Icon],
  host: { class: 'herald-toast-outlet' },
  template: `
    @if (browser) {
      <section class="herald-toasts" role="status" aria-live="polite" aria-label="Notifications">
        @for (toast of toasts.toasts(); track toast.id) {
          <div
            class="herald-toast"
            [attr.data-tone]="toast.tone"
            (mouseenter)="toasts.pause(toast.id)"
            (mouseleave)="toasts.resume(toast.id)"
            (focusin)="toasts.pause(toast.id)"
            (focusout)="toasts.resume(toast.id)"
          >
            <herald-icon [name]="toast.tone === 'success' ? 'circle-check' : 'info-circle'" />
            <p>{{ toast.text }}</p>
            <button type="button" class="herald-toast-dismiss" aria-label="Dismiss notification" (click)="toasts.dismiss(toast.id)">
              <herald-icon name="x" />
            </button>
          </div>
        }
      </section>
    }
  `,
  styleUrl: './toast.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutlet {
  protected readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly toasts = inject(Toasts);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.toasts.clear());
    // On a narrow screen the page reserves the stack's height below its content, so the stack never covers its primary action.
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const body = inject(DOCUMENT).body;
    afterEveryRender(() => {
      const height = host.querySelector('.herald-toasts')?.getBoundingClientRect().height ?? 0;
      body.style.setProperty('--herald-toast-reserve', height ? `${height + 16}px` : '0px');
    });
  }
}
