import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import axe from 'axe-core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AccessState, AppContext, AUTH_CONFIG } from '../../platform';
import { CreateOrganisationPage } from './create-organisation-page';

const problem = (status: number, body: object) =>
  new HttpErrorResponse({ status, error: body, headers: new HttpHeaders({ 'content-type': 'application/problem+json' }) });

function render(answers: (() => Observable<unknown>)[] = []) {
  const calls: { organisationId: string; name: string }[] = [];
  const api = {
    createOrganisation: (body: { organisationId: string; name: string }) => {
      calls.push(body);
      return (answers.shift() ?? (() => of({ id: body.organisationId, name: body.name })))();
    },
  };
  const context = { enter: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: HeraldHostAdminService, useValue: api },
      { provide: AppContext, useValue: context },
      { provide: AUTH_CONFIG, useValue: { authority: 'https://d.example/', clientId: 'c', apiScope: 's', publicUrl: 'http://localhost:4300' } },
    ],
  });
  const fixture = TestBed.createComponent(CreateOrganisationPage);
  document.body.appendChild(fixture.nativeElement);
  const element = fixture.nativeElement as HTMLElement;
  const input = element.querySelector<HTMLInputElement>('#organisation-name')!;
  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };
  return { element, input, type, submit, calls, context, fixture, text: (s: string) => element.querySelector(s)?.textContent?.trim() };
}

describe('Creating an organisation', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('asks for a name and keeps focus on the field', async () => {
    const { submit, text, input, calls } = render();
    await submit();
    expect(text('#name-error')).toBe('Enter an organisation name.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('name-help name-error');
    expect(document.activeElement).toBe(input);
    expect(calls).toHaveLength(0);
  });

  it('refuses a name longer than 80 characters after trimming', async () => {
    const { type, submit, text, calls } = render();
    type(` ${'a'.repeat(80)} `);
    await submit();
    expect(calls).toHaveLength(1);

    TestBed.resetTestingModule();
    const second = render();
    second.type('a'.repeat(81));
    await second.submit();
    expect(second.text('#name-error')).toBe('Use 80 characters or fewer.');
    expect(second.calls).toHaveLength(0);
    expect(text('h1')).toBe('Create an organisation');
  });

  it('enters the new organisation, announcing that it was created', async () => {
    const { type, submit, calls, context } = render();
    type('  Northside Gaming ');
    await submit();
    expect(calls[0].name).toBe('Northside Gaming');
    expect(context.enter).toHaveBeenCalledWith(`/organisations/${calls[0].organisationId}?created`);
  });

  it('shows it is creating and does not submit twice', async () => {
    const pending = new Subject<unknown>();
    const { type, submit, calls, input, text, element } = render([() => pending]);
    type('Northside Gaming');
    await submit();
    expect(input.readOnly).toBe(true);
    expect(text('[role="status"]')).toContain('Creating your organisation');
    expect(element.querySelector('form')?.getAttribute('aria-busy')).toBe('true');
    await submit();
    expect(calls).toHaveLength(1);
  });

  it('keeps the name and the same identifier when a save fails and is tried again', async () => {
    const { type, submit, calls, input, text, context } = render([() => throwError(() => new HttpErrorResponse({ status: 0 }))]);
    type('Northside Gaming');
    await submit();
    expect(text('herald-notice strong')).toBe('Organisation not created');
    expect(input.value).toBe('Northside Gaming');
    expect(text('button[type="submit"]')).toBe('Try again');

    await submit();
    expect(calls[1].organisationId).toBe(calls[0].organisationId);
    expect(context.enter).toHaveBeenCalledOnce();
  });

  it('uses a new identifier when the name changes or the identifier conflicts', async () => {
    const failure = () => throwError(() => new HttpErrorResponse({ status: 500 }));
    const { type, submit, calls } = render([failure, () => throwError(() => problem(409, { title: 'Conflict' })), failure]);
    type('Northside Gaming');
    await submit();
    type('Northside Gaming Club');
    await submit();
    await submit();
    expect(calls[1].organisationId).not.toBe(calls[0].organisationId);
    expect(calls[2].organisationId).not.toBe(calls[1].organisationId);
  });

  it('shows the field error the API returns', async () => {
    const { type, submit, text } = render([() => throwError(() => problem(400, { errors: { name: ['too-long'] } }))]);
    type('Northside Gaming');
    await submit();
    expect(text('#name-error')).toBe('Use 80 characters or fewer.');
    expect(text('herald-notice')).toBeUndefined();
  });

  it('leaves lost access to its own state', async () => {
    const { type, submit, text } = render([
      () => {
        TestBed.inject(AccessState).report('session-expired');
        return throwError(() => new HttpErrorResponse({ status: 401 }));
      },
    ]);
    type('Northside Gaming');
    await submit();
    expect(text('herald-notice')).toBeUndefined();
  });

  it('offers the typed name for copying if access stops', () => {
    const { type } = render();
    type('Northside Gaming');
    const access = TestBed.inject(AccessState);
    access.report('session-expired');
    expect(access.unsavedInput()).toBe('Northside Gaming');
  });

  it('has no automatically detectable accessibility violations, also with an error', async () => {
    const { element, submit } = render();
    await submit();
    const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
