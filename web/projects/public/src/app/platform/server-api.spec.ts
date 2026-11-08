import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideServerApi } from './server-api';

function serverHttp(apiUrl: string | undefined) {
  const fetch = vi.fn(async () => new Response('{}', { headers: { 'content-type': 'application/json' } }));
  vi.stubGlobal('fetch', fetch);
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withFetch()),
      provideServerApi(apiUrl),
      { provide: REQUEST, useValue: new Request('http://herald.example/tournaments') },
    ],
  });
  const sent = () => {
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    return { url, headers: new Headers(init.headers), credentials: init.credentials };
  };
  return { http: TestBed.inject(HttpClient), sent };
}

describe('The server API transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends this site’s /api requests to the Herald API without credentials', async () => {
    const { http, sent } = serverHttp('http://api.internal:5100');
    await firstValueFrom(http.get('/api/tournaments?page=2', { headers: { Authorization: 'Bearer x', Cookie: 'session=y', Accept: 'application/json' } }));
    expect(sent().url).toBe('http://api.internal:5100/api/tournaments?page=2');
    expect(sent().headers.has('authorization')).toBe(false);
    expect(sent().headers.has('cookie')).toBe(false);
    expect(sent().headers.get('accept')).toBe('application/json');
    expect(sent().credentials).toBe('omit');
  });

  it('also strips credentials from requests to other hosts, and leaves their URL alone', async () => {
    const { http, sent } = serverHttp('http://api.internal:5100');
    await firstValueFrom(http.get('https://other.example/api/data', { headers: { Authorization: 'Bearer x' } }));
    expect(sent().url).toBe('https://other.example/api/data');
    expect(sent().headers.has('authorization')).toBe(false);
  });

  it('fails clearly when the API address is not configured', async () => {
    const { http } = serverHttp(undefined);
    await expect(firstValueFrom(http.get('/api/tournaments'))).rejects.toThrow('HERALD_API_URL is not set');
  });
});
