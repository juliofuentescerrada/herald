import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { NgpButton } from 'ng-primitives/button';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

/**
 * A native button or link with Herald's variants and states. Loading keeps the label and width,
 * stays focusable and announced, and blocks a repeat (W-03 experiment).
 */
@Component({
  selector: 'button[herald-button], a[herald-button]',
  hostDirectives: [NgpButton],
  host: {
    class: 'herald-button',
    '[attr.data-variant]': 'variant()',
    '[attr.aria-busy]': 'loading() || null',
  },
  template: `@if (loading()) {<span class="herald-button-spinner" aria-hidden="true"></span>}<ng-content />`,
  styleUrl: './button.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  constructor() {
    // 'soft' disables with aria-disabled but keeps focus; ng-primitives still delivers its events.
    const button = inject(NgpButton);
    effect(() => button.setDisabled(this.loading() ? 'soft' : this.disabled()));

    // Capture runs before the consumer's (click) on the same element.
    const element: HTMLElement = inject(ElementRef).nativeElement;
    afterNextRender(() =>
      element.addEventListener(
        'click',
        (event) => {
          if (this.loading()) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        { capture: true },
      ),
    );
  }
}
