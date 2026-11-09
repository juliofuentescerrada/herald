import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { AccessPage } from './access-page';
import { AccessProblem, AccessState, AppContext, AUTH_CONFIG, Session } from './platform';

function render(problem: AccessProblem, unsaved = '') {
  const session = { account: signal({ username: 'ana' }), signIn: vi.fn(async () => undefined) };
  const context = { replace: vi.fn(), signOut: vi.fn(async () => undefined) };
  TestBed.configureTestingModule({
    providers: [
      { provide: Session, useValue: session },
      { provide: AppContext, useValue: context },
      { provide: AUTH_CONFIG, useValue: { authority: 'https://d.example/', clientId: 'c', apiScope: 's', publicUrl: 'http://localhost:4300' } },
    ],
  });
  const access = TestBed.inject(AccessState);
  if (unsaved) TestBed.runInInjectionContext(() => access.keepDraft(() => unsaved));
  access.report(problem);
  const fixture = TestBed.createComponent(AccessPage);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const button = (label: string) => [...element.querySelectorAll<HTMLElement>('button, a')].find((b) => b.textContent?.trim() === label);
  return { element, session, context, access, fixture, button, text: (s: string) => element.querySelector(s)?.textContent?.trim() };
}

describe('The access page', () => {
  afterEach(() => TestBed.resetTestingModule());

  it.each<[AccessProblem, string]>([
    ['signing-in', 'Taking you to sign in'],
    ['sign-in-failed', 'Sign-in did not complete'],
    ['sign-in-cancelled', 'Sign-in was cancelled'],
    ['not-assigned', 'Herald access is by invitation'],
    ['session-expired', 'Sign in again to continue'],
    ['unavailable', 'This page is unavailable'],
    ['recovery', 'Recover access to your account'],
  ])('shows %s', async (problem, heading) => {
    const { text, element } = render(problem);
    expect(text('h1')).toBe(heading);
    const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  it('signs in again and returns to the same address', () => {
    const { button, session } = render('session-expired');
    button('Sign in again')!.click();
    expect(session.signIn).toHaveBeenCalledWith(`${location.pathname}${location.search}${location.hash}`, false);
  });

  it('lets an unassigned person choose another account or sign out', () => {
    const { button, session, context } = render('not-assigned');
    button('Use another account')!.click();
    expect(session.signIn).toHaveBeenCalledWith(expect.any(String), true);
    button('Sign out')!.click();
    expect(context.signOut).toHaveBeenCalled();
  });

  it('offers no way to organise to an unassigned person', () => {
    const { button } = render('not-assigned');
    expect(button('Go to your organisations')).toBeUndefined();
  });

  it('keeps the person’s unsaved input for copying after an expired session', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { element, button, fixture, text } = render('session-expired', 'Confirm the venue opening time.');
    expect(element.querySelector('textarea')?.value).toBe('Confirm the venue opening time.');
    expect(element.querySelector('textarea')?.readOnly).toBe(true);

    button('Copy unsaved input')!.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('Confirm the venue opening time.');
    expect(text('.copy-status')).toBe('Your unsaved input was copied.');
  });

  it('says a rejected change was not saved and keeps its input', () => {
    const { text, element } = render('unavailable', 'Round 3 notes');
    expect(text('herald-notice strong')).toBe('Your change was not saved');
    expect(element.querySelector('textarea')?.value).toBe('Round 3 notes');
  });

  it('never names the organisation or confirms it exists', () => {
    const { element } = render('unavailable');
    expect(element.textContent).not.toMatch(/Northside|organisation access is no longer/i);
    expect(element.querySelector('textarea')).toBeNull();
  });

  it('goes back to the person’s organisations with a full load', () => {
    const { button, context } = render('unavailable');
    button('Go to your organisations')!.click();
    expect(context.replace).toHaveBeenCalledWith('/');
  });

  it('offers recovery help after a failed sign-in', () => {
    const { button, access, fixture, text } = render('sign-in-failed');
    button('Get recovery help')!.click();
    fixture.detectChanges();
    expect(access.problem()).toBe('recovery');
    expect(text('h1')).toBe('Recover access to your account');
  });

  it('links back to the public application', () => {
    const { button } = render('sign-in-cancelled');
    expect(button('Back to public page')?.getAttribute('href')).toBe('http://localhost:4300');
  });
});
