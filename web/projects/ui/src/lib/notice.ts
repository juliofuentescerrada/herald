import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';
import { Icon, IconName } from './icon';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

const toneIcons: Record<NoticeTone, IconName> = {
  info: 'info-circle',
  success: 'circle-check',
  warning: 'alert-triangle',
  danger: 'alert-circle',
};

/**
 * Text feedback with a tone. Danger is an alert (announced at once); the others are status.
 * The heading says what happened, the content what to do next.
 */
@Component({
  selector: 'herald-notice',
  imports: [Icon],
  host: {
    class: 'herald-notice',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'",
  },
  template: `
    <herald-icon class="herald-notice-icon" [name]="icon()" />
    <div class="herald-notice-body">
      @if (heading()) {
        <strong class="herald-notice-heading">{{ heading() }}</strong>
      }
      <ng-content />
    </div>
    @if (dismissible()) {
      <button type="button" class="herald-notice-dismiss" [attr.aria-label]="dismissLabel()" (click)="dismissed.emit()">
        <herald-icon name="x" />
      </button>
    }
  `,
  styleUrl: './notice.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notice {
  readonly tone = input<NoticeTone>('info');
  readonly heading = input<string>();
  /** Overrides the tone's icon, for example `refresh` for a section that must reload. */
  readonly iconName = input<IconName>();
  readonly dismissible = input(false);
  readonly dismissLabel = input('Dismiss');
  readonly dismissed = output<void>();

  protected readonly icon = computed(() => this.iconName() ?? toneIcons[this.tone()]);
}
