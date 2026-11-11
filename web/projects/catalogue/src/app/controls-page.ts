import { ChangeDetectionStrategy, Component, inject, signal, TemplateRef, ViewContainerRef } from '@angular/core';
import { Button, ButtonVariant, Dialog, DialogContext, Dialogs, Drawer, Icon, NavLink, Notice, StatusLabel, ToastOutlet, Toasts } from '@herald/ui';
import { RecoveryDemo } from './recovery-demo';

/** Every ui control in every state the shells use. Hover, press and focus are live. */
@Component({
  selector: 'app-controls-page',
  imports: [Button, Dialog, Drawer, Icon, NavLink, Notice, StatusLabel, ToastOutlet, RecoveryDemo],
  templateUrl: './controls-page.html',
  styleUrl: './controls-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsPage {
  protected readonly variants: readonly { variant: ButtonVariant; label: string }[] = [
    { variant: 'primary', label: 'Publish' },
    { variant: 'secondary', label: 'Save draft' },
    { variant: 'quiet', label: 'Cancel' },
    { variant: 'destructive', label: 'Withdraw entry' },
  ];
  protected readonly presses = signal(0);
  protected readonly infoShown = signal(true);

  private readonly dialogs = inject(Dialogs);
  private readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly toasts = inject(Toasts);
  /** The state the open dialog or drawer shows: busy and failed are fixed for review. */
  protected readonly surfaceState = signal<'default' | 'busy' | 'failed'>('default');

  protected open(template: TemplateRef<DialogContext>, state: 'default' | 'busy' | 'failed', trigger: HTMLElement) {
    this.surfaceState.set(state);
    this.dialogs.open(template, { trigger, viewContainerRef: this.viewContainerRef });
  }

  protected stack() {
    this.toasts.show('Ellis Stone admitted.');
    this.toasts.show('Robin Vale’s entry cancelled.');
    this.toasts.show('Changes saved.');
  }
}
