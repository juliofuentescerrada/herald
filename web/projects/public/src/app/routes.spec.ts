import { provideHttpClient } from '@angular/common/http';
import { RESPONSE_INIT } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RenderMode } from '@angular/ssr';
import { provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { App } from './app';
import { routes } from './app.routes';
import { serverRoutes } from './app.routes.server';
import { fixtureRoutes } from './fixtures';
import * as production from './fixtures.production';
import { QUERY_CLIENT } from './platform';

// The API is the testing backend: no request leaves the test, and each one is answered explicitly.
async function open(url: string, response: ResponseInit | null = null, answer?: (http: HttpTestingController) => Promise<void>) {
  TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting(), provideTanStackQuery(QUERY_CLIENT), { provide: RESPONSE_INIT, useValue: response }] });
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await answer?.(TestBed.inject(HttpTestingController));
  await fixture.whenStable();
  TestBed.inject(HttpTestingController).verify();
  return fixture.nativeElement as HTMLElement;
}

describe('Public routes', () => {
  it('answer an unknown address with a not-found page and status 404', async () => {
    const response: ResponseInit = {};
    const element = await open('/tournaments/private-cup', response);
    expect(element.querySelector('h1')?.textContent).toBe('Page not found');
    expect(response.status).toBe(404);
  });

  it('prerender the home page and render anything else per request', () => {
    expect(serverRoutes[0]).toEqual({ path: '', renderMode: RenderMode.Prerender });
    expect(serverRoutes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Server });
  });

  it('render the fixtures in the modes they stand for, in development only', async () => {
    expect(serverRoutes.find((r) => r.path === '_fixtures/ssr')?.renderMode).toBe(RenderMode.Server);
    expect(serverRoutes.find((r) => r.path === '_fixtures/client')?.renderMode).toBe(RenderMode.Client);
    expect(fixtureRoutes).toHaveLength(2);
    expect(production.fixtureRoutes).toEqual([]);
    expect(production.fixtureServerRoutes).toEqual([]);

    const element = await open('/_fixtures/ssr', null, async (http) => {
      // The query starts once the page renders.
      const request = await vi.waitFor(() => http.expectOne('/api/_fixtures/public'));
      request.flush({ message: 'Public data from the API' });
    });
    expect(element.querySelector('h1')?.textContent).toBe('Server-rendered fixture');
    await vi.waitFor(() => expect(element.textContent).toContain('Public data from the API'));
  });
});
