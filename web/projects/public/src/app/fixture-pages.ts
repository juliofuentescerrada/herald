import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal, TransferState, makeStateKey } from '@angular/core';
import { Button } from '@herald/ui';

const renderedKey = makeStateKey<string>('fixture-rendered');

/** Server-rendered per request, then hydrated: the counter proves the page became interactive. */
@Component({
  selector: 'app-server-fixture-page',
  imports: [Button],
  template: `
    <main class="fixture">
      <p class="eyebrow">Development fixture · never deployed</p>
      <h1>Server-rendered fixture</h1>
      <p>Rendered on the {{ renderedBy }} for this request.</p>
      <button herald-button type="button" (click)="presses.set(presses() + 1)">Pressed {{ presses() }} times</button>
    </main>
  `,
  styleUrl: './fixture-pages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerFixturePage {
  /** The server's answer travels in the transfer state, so hydration shows the same text. */
  protected readonly renderedBy = (() => {
    const state = inject(TransferState);
    if (isPlatformServer(inject(PLATFORM_ID))) state.set(renderedKey, 'server');
    return state.get(renderedKey, 'browser');
  })();
  protected readonly presses = signal(0);
}

/** Never rendered on the server, like the participant workflows it stands in for. */
@Component({
  selector: 'app-client-fixture-page',
  template: `
    <main class="fixture">
      <p class="eyebrow">Development fixture · never deployed</p>
      <h1>Client-rendered fixture</h1>
      <p>Rendered in the browser; the server sent only the shell.</p>
    </main>
  `,
  styleUrl: './fixture-pages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFixturePage {}
