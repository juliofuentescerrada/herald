import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { operationIdHeader, operationIdentity } from './operation';

const sent = async (send: (http: HttpClient) => Promise<unknown>, url: string) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([operationIdentity])), provideHttpClientTesting()] });
  const done = send(TestBed.inject(HttpClient));
  const call = TestBed.inject(HttpTestingController).expectOne(url);
  call.flush({});
  await done;
  return call.request.headers.get(operationIdHeader);
};

describe('Operation identity', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('gives each organisation mutation its own identity', async () => {
    const url = '/api/organisations/1/tournaments/2/publication';
    const first = await sent((http) => firstValueFrom(http.post(url, {})), url);
    const second = await sent((http) => firstValueFrom(http.post(url, {})), url);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(second).not.toBe(first);
  });

  it('keeps an identity the request already names', async () => {
    const url = '/api/organisations/1/tournaments/2/matches/3/result';
    const header = await sent((http) => firstValueFrom(http.post(url, {}, { headers: { [operationIdHeader]: 'chosen' } })), url);
    expect(header).toBe('chosen');
  });

  it('sends reads and organisation creation as they are', async () => {
    expect(await sent((http) => firstValueFrom(http.get('/api/organisations/1/tournaments')), '/api/organisations/1/tournaments')).toBeNull();
    expect(await sent((http) => firstValueFrom(http.post('/api/organisations', {})), '/api/organisations')).toBeNull();
  });
});
