import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injectable, inject, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { Button } from '@herald/ui';

const renderedKey = makeStateKey<string>('fixture-rendered');

interface EchoResponse {
  readonly marker: string;
  readonly sawCredentials: boolean;
}

/** Request-local state: `providedIn: 'root'` is one instance per server request (W-06). */
@Injectable({ providedIn: 'root' })
export class RequestMarker {
  readonly value = signal('');
}

/**
 * Server-rendered per request, then hydrated. With `?marker=…` it also stores the marker in a
 * request-local service and queries the API with a credential that the server transport must strip;
 * the isolation check (`pnpm test:ssr`) renders many markers at once and compares.
 */
@Component({
  selector: 'app-server-fixture-page',
  imports: [Button],
  template: `
    <main class="fixture">
      <p class="eyebrow">Development fixture · never deployed</p>
      <h1>Server-rendered fixture</h1>
      <p>Rendered on the {{ renderedBy }} for this request.</p>
      @if (marker.value()) {
        <dl>
          <dt>Request marker</dt><dd data-check="provider">{{ marker.value() }}</dd>
          <dt>API answer</dt>
          <dd data-check="query">
            @if (echo.data(); as data) { {{ data.marker }} } @else if (echo.isError()) { error: {{ echo.error()?.message }} } @else { pending }
          </dd>
          <dt>API saw credentials</dt><dd data-check="credentials">{{ echo.data()?.sawCredentials ? 'yes' : 'no' }}</dd>
        </dl>
      }
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
  protected readonly marker = inject(RequestMarker);
  private readonly http = inject(HttpClient);

  protected readonly echo = injectQuery(() => ({
    // The same key in every request while the answer depends on the request: a shared cache would leak it.
    queryKey: ['fixture', 'echo'],
    enabled: this.marker.value() !== '',
    queryFn: () =>
      lastValueFrom(
        this.http.get<EchoResponse>('/api/_fixtures/echo', {
          params: { marker: this.marker.value() },
          // A feature that sets a credential: the server must never send it (W-06).
          headers: { Authorization: 'Bearer fixture-secret' },
        }),
      ),
  }));

  constructor() {
    this.marker.value.set(inject(ActivatedRoute).snapshot.queryParamMap.get('marker') ?? '');
  }
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
