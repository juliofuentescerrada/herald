import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, ButtonVariant, Icon, NavLink, Notice, StatusLabel } from '@herald/ui';
import { RecoveryDemo } from './recovery-demo';

/** Every ui control in every state the shells use. Hover, press and focus are live. */
@Component({
  selector: 'app-controls-page',
  imports: [Button, Icon, NavLink, Notice, StatusLabel, RecoveryDemo],
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
}
