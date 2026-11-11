import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  effect,
  ElementRef,
  inject,
  Injectable,
  input,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import { injectDialogRef, NgpDialog, NgpDialogContext, NgpDialogDescription, NgpDialogManager, NgpDialogOverlay, NgpDialogTitle } from 'ng-primitives/dialog';
import { firstValueFrom } from 'rxjs';
import { Button } from './button';

/** An open dialog or drawer. `closed` settles once it has left and focus has returned. */
export interface DialogRef {
  close(): void;
  readonly closed: Promise<void>;
}

/** What `Dialogs.open` passes to the template: `let-close="close"`. */
export interface DialogContext {
  close: () => void;
}

export interface ConfirmOptions {
  /** The question. */
  heading: string;
  /** The consequence. */
  body: string;
  confirmLabel: string;
  leaveLabel: string;
  destructive?: boolean;
}

/**
 * Opens dialogs and drawers. Escape and the leaving action close without a change; the backdrop
 * does not, so typed input is never lost by a stray click. Focus returns to the opener.
 */
@Injectable({ providedIn: 'root' })
export class Dialogs {
  private readonly manager = inject(NgpDialogManager);

  open(template: TemplateRef<DialogContext>, options: { trigger?: HTMLElement; viewContainerRef?: ViewContainerRef } = {}): DialogRef {
    const ref = this.manager.open(template as TemplateRef<NgpDialogContext>, {
      triggerElement: options.trigger,
      viewContainerRef: options.viewContainerRef,
      closeOnOutsideClick: false,
    });
    return { close: () => void ref.close(), closed: firstValueFrom(ref.afterClosed$).then(() => undefined) };
  }

  /** A one-question confirmation; resolves true only when the confirming action is chosen. */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.manager.open<ConfirmOptions, boolean>(ConfirmDialog, { data: options, closeOnOutsideClick: false });
    return (await firstValueFrom(ref.afterClosed)) === true;
  }
}


/**
 * Shared behaviour of the modal surfaces: the title is the question, Escape is ignored while busy,
 * and an element marked `data-herald-initial-focus` receives focus on opening (the leaving action
 * of a destructive confirmation), otherwise the first focusable element does. A dialog's body is
 * its consequence and describes it; a drawer's body is a whole flow and does not.
 */
@Directive()
abstract class ModalSurface {
  readonly heading = input.required<string>();
  readonly busy = input(false, { transform: booleanAttribute });

  constructor() {
    const ref = injectDialogRef();
    effect(() => (ref.disableClose = this.busy()));

    const element: HTMLElement = inject(ElementRef).nativeElement;
    // After the focus trap's own first focus, which also runs after render.
    afterNextRender(() => setTimeout(() => element.querySelector<HTMLElement>('[data-herald-initial-focus]')?.focus()));
  }
}

/** A modal dialog for a consequential action; full width at the bottom of a narrow screen. */
@Component({
  selector: 'herald-dialog',
  imports: [NgpDialog, NgpDialogTitle, NgpDialogDescription],
  hostDirectives: [NgpDialogOverlay],
  host: { class: 'herald-dialog', 'data-placement': 'centre' },
  template: `
    <section ngpDialog class="herald-dialog-panel" [attr.aria-busy]="busy() || null">
      <h2 ngpDialogTitle class="herald-dialog-heading">{{ heading() }}</h2>
      <div ngpDialogDescription class="herald-dialog-body"><ng-content /></div>
      <ng-content select="[heraldDialogActions]" />
    </section>
  `,
  styleUrl: './dialog.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog extends ModalSurface {}

/** The dialog at the side of a wide screen (about 480 px) and over the whole of a narrow one. */
@Component({
  selector: 'herald-drawer',
  imports: [NgpDialog, NgpDialogTitle],
  hostDirectives: [NgpDialogOverlay],
  host: { class: 'herald-dialog', 'data-placement': 'side' },
  template: `
    <section ngpDialog class="herald-dialog-panel" [attr.aria-busy]="busy() || null">
      <h2 ngpDialogTitle class="herald-dialog-heading">{{ heading() }}</h2>
      <div class="herald-dialog-body"><ng-content /></div>
      <ng-content select="[heraldDialogActions]" />
    </section>
  `,
  styleUrl: './dialog.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drawer extends ModalSurface {}

@Component({
  selector: 'herald-confirm-dialog',
  imports: [Dialog, Button],
  template: `
    <herald-dialog [heading]="options.heading">
      <p>{{ options.body }}</p>
      <div heraldDialogActions>
        <button herald-button type="button" [variant]="options.destructive ? 'destructive' : 'primary'" (click)="ref.close(true)">
          {{ options.confirmLabel }}
        </button>
        <button herald-button type="button" data-herald-initial-focus (click)="ref.close(false)">{{ options.leaveLabel }}</button>
      </div>
    </herald-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ConfirmDialog {
  protected readonly ref = injectDialogRef<ConfirmOptions, boolean>();
  protected readonly options = this.ref.data;
}
