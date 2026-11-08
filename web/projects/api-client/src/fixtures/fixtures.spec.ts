import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { problemOf } from '../problem';
import {
  FixtureItem,
  HeraldApiFixturesPublicService,
  ProblemDetails,
} from './public/generated/api';
import {
  FixtureItemRevised,
  HeraldApiFixturesAdminService,
  ValidationProblemDetails,
} from './admin/generated/api';

// The fixture host's documents (tests/Herald.ApiFixtures) generate the clients these tests use.
describe('The generated client', () => {
  const id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const problem = { 'content-type': 'application/problem+json' };
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const failure = async (call: Promise<unknown>) =>
    call.then(
      () => expect.fail('expected an error'),
      (error: unknown) => error,
    );

  it('requests the declared route and returns the declared response type, nulls and revision included', async () => {
    const result = firstValueFrom(
      TestBed.inject(HeraldApiFixturesPublicService).getFixtureItem(id),
    );
    const request = http.expectOne(`/api/fixtures/items/${id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ id, name: 'Item', note: null, revision: 3 });

    const item: FixtureItem = await result;
    const note: string | null = item.note;
    const revision: number = item.revision;
    expect([note, revision]).toEqual([null, 3]);
  });

  it('sends a command body and returns its receipt with the new revision', async () => {
    const result = firstValueFrom(
      TestBed.inject(HeraldApiFixturesAdminService).reviseFixtureItem(id, {
        name: 'Renamed',
        note: 'n',
        expectedRevision: 3,
      }),
    );
    const request = http.expectOne(`/api/fixtures/items/${id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ name: 'Renamed', note: 'n', expectedRevision: 3 });
    request.flush({ id, revision: 4 });

    const receipt: FixtureItemRevised = await result;
    expect(receipt.revision).toBe(4);
  });

  it('exposes validation errors as the generated ValidationProblemDetails', async () => {
    const result = failure(
      firstValueFrom(
        TestBed.inject(HeraldApiFixturesAdminService).reviseFixtureItem(id, {
          name: '',
          note: null,
          expectedRevision: 3,
        }),
      ),
    );
    http
      .expectOne(`/api/fixtures/items/${id}`)
      .flush(
        {
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: { name: ['Name is required.'] },
        },
        { status: 400, statusText: 'Bad Request', headers: problem },
      );

    expect(problemOf<ValidationProblemDetails>(await result)?.errors).toEqual({
      name: ['Name is required.'],
    });
  });

  it.each([
    [403, 'Forbidden'],
    [409, 'Conflict'],
  ])(
    'exposes a %i error as the generated ProblemDetails, without acting on it',
    async (status, statusText) => {
      const result = failure(
        firstValueFrom(
          TestBed.inject(HeraldApiFixturesAdminService).reviseFixtureItem(id, {
            name: 'x',
            note: null,
            expectedRevision: 2,
          }),
        ),
      );
      http
        .expectOne(`/api/fixtures/items/${id}`)
        .flush({ title: statusText, status }, { status, statusText, headers: problem });

      const error = await result;
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect(problemOf<ProblemDetails>(error)).toEqual({ title: statusText, status });
    },
  );

  it('reads no problem from an error of another media type or from a network failure', async () => {
    const service = TestBed.inject(HeraldApiFixturesPublicService);

    const plain = failure(firstValueFrom(service.getFixtureItem(id)));
    http
      .expectOne(`/api/fixtures/items/${id}`)
      .flush('Bad gateway', { status: 502, statusText: 'Bad Gateway' });
    expect(problemOf<ProblemDetails>(await plain)).toBeUndefined();

    const offline = failure(firstValueFrom(service.getFixtureItem(id)));
    http.expectOne(`/api/fixtures/items/${id}`).error(new ProgressEvent('error'));
    expect(problemOf<ProblemDetails>(await offline)).toBeUndefined();
  });
});
