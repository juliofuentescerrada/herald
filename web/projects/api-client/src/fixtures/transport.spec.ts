import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, InjectionToken, inject } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { HeraldApiFixturesPublicService } from './public/generated/api';

// Each application (in SSR, each request) supplies its own base URL and credential through its own
// interceptors; the generated client keeps none of its own (task 5.3, W-06).
const CONTEXT = new InjectionToken<{ baseUrl: string; token: string }>('Transport context');
const transport: HttpInterceptorFn = (request, next) => {
  const { baseUrl, token } = inject(CONTEXT);
  return next(
    request.clone({ url: baseUrl + request.url, setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};

const application = (baseUrl: string, token: string) =>
  createApplication({
    providers: [
      { provide: CONTEXT, useValue: { baseUrl, token } },
      provideHttpClient(withInterceptors([transport])),
      provideHttpClientTesting(),
    ],
  });

describe('The generated client in separate applications', () => {
  const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  let apps: ApplicationRef[] = [];

  afterEach(() => {
    apps.forEach((app) => app.destroy());
    apps = [];
  });

  it('sends each request with its own application context, also when they overlap', async () => {
    apps = [
      await application('https://a.example', 'user-a'),
      await application('https://b.example', 'user-b'),
    ];
    const [a, b] = apps.map((app) => app.injector);

    const first = firstValueFrom(a.get(HeraldApiFixturesPublicService).getFixtureItem(id));
    const second = firstValueFrom(b.get(HeraldApiFixturesPublicService).getFixtureItem(id));
    const requestB = b
      .get(HttpTestingController)
      .expectOne(`https://b.example/api/fixtures/items/${id}`);
    const requestA = a
      .get(HttpTestingController)
      .expectOne(`https://a.example/api/fixtures/items/${id}`);

    expect(requestA.request.headers.get('Authorization')).toBe('Bearer user-a');
    expect(requestB.request.headers.get('Authorization')).toBe('Bearer user-b');
    requestB.flush({ id, name: 'B', note: null, revision: 2 });
    requestA.flush({ id, name: 'A', note: null, revision: 1 });
    expect((await first).name).toBe('A');
    expect((await second).name).toBe('B');
    expect(a.get(HeraldApiFixturesPublicService)).not.toBe(b.get(HeraldApiFixturesPublicService));
    a.get(HttpTestingController).verify();
    b.get(HttpTestingController).verify();
  });

  it('adds no base URL, credential or cache option of its own', async () => {
    apps = [
      await createApplication({ providers: [provideHttpClient(), provideHttpClientTesting()] }),
    ];
    const [app] = apps;

    void firstValueFrom(app.injector.get(HeraldApiFixturesPublicService).getFixtureItem(id));
    const { request } = app.injector
      .get(HttpTestingController)
      .expectOne(`/api/fixtures/items/${id}`);

    expect(request.headers.keys()).toEqual([]);
    expect(request.withCredentials).toBe(false);
    expect(request.transferCache).toBeUndefined();
  });
});
