import { FetchBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable, InjectionToken, inject, Provider, REQUEST } from '@angular/core';
import { notifyManager } from '@tanstack/angular-query-experimental';
import { Observable, throwError } from 'rxjs';

/** The Herald API origin the server calls, for example `http://localhost:5100` (W-05). */
export const HERALD_API_URL = new InjectionToken<string | undefined>('Herald API URL on the server');

const credentialHeaders = ['Authorization', 'Cookie'];

/**
 * The server's transport (W-05, W-06). It runs after every interceptor, so the transfer cache keys
 * the request by the `/api` URL the browser also uses; it rewrites requests for this site's `/api`
 * to the API's origin and sends every request anonymously, whatever a feature set.
 */
@Injectable()
export class ServerApiBackend extends FetchBackend {
  private readonly apiUrl = inject(HERALD_API_URL);
  /** Angular resolves relative URLs against the incoming request before they reach the backend. */
  private readonly ownOrigin = (() => {
    const request = inject(REQUEST, { optional: true });
    return request ? new URL(request.url).origin : null;
  })();

  override handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    let headers = request.headers;
    for (const name of credentialHeaders) headers = headers.delete(name);
    let url = request.url;
    const target = new URL(url, this.ownOrigin ?? 'http://relative.invalid');
    const ownApi = (url.startsWith('/') || target.origin === this.ownOrigin) && target.pathname.startsWith('/api/');
    if (ownApi) {
      if (!this.apiUrl) return throwError(() => new Error('HERALD_API_URL is not set: the server cannot reach the Herald API.'));
      url = new URL(target.pathname + target.search, this.apiUrl).href;
    }
    return super.handle(request.clone({ url, headers, withCredentials: false, credentials: 'omit' }));
  }
}

/** Server-only providers: the anonymous API transport, and TanStack queries that finish within the render. */
export function provideServerApi(apiUrl: string | undefined): Provider[] {
  // Process-wide configuration, not request state: TanStack must report fetching at once, or the
  // render completes before the query starts and serialises `pending` (W-06).
  notifyManager.setScheduler((callback) => callback());
  return [{ provide: HERALD_API_URL, useValue: apiUrl }, { provide: FetchBackend, useClass: ServerApiBackend }];
}
