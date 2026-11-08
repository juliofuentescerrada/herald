import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** A readable status. Each tone sets its own foreground and background (visual direction §3.1). */
@Component({
  selector: 'herald-status-label',
  host: { class: 'herald-status-label', '[attr.data-tone]': 'tone()' },
  template: `<ng-content />`,
  styles: `
    .herald-status-label {
      display: inline-flex;
      align-items: center;
      padding: var(--herald-space-1) var(--herald-space-2);
      border-radius: var(--herald-radius-default);
      font-size: var(--herald-text-base);
      font-weight: 600;
      white-space: nowrap;
      background: var(--herald-color-neutral-surface);
      color: var(--herald-color-text-primary);
    }
    .herald-status-label[data-tone='info'] { background: var(--herald-color-feedback-info-surface); color: var(--herald-color-feedback-info); }
    .herald-status-label[data-tone='success'] { background: var(--herald-color-feedback-success-surface); color: var(--herald-color-feedback-success); }
    .herald-status-label[data-tone='warning'] { background: var(--herald-color-feedback-warning-surface); color: var(--herald-color-feedback-warning); }
    .herald-status-label[data-tone='danger'] { background: var(--herald-color-feedback-danger-surface); color: var(--herald-color-feedback-danger); }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusLabel {
  readonly tone = input<StatusTone>('neutral');
}
