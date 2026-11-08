import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import axe from 'axe-core';
import { App } from './app';
import { routes } from './app.routes';

async function openShell(url = '/') {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const fixture = TestBed.createComponent(App);
  document.body.appendChild(fixture.nativeElement);
  const router = TestBed.inject(Router);
  const navigate = async (target: string) => {
    await router.navigateByUrl(target);
    await fixture.whenStable();
  };
  await navigate(url);
  const element = fixture.nativeElement as HTMLElement;
  return { element, fixture, navigate, menu: element.querySelector('.menu-button') as HTMLButtonElement };
}

describe('The public shell', () => {
  it('shows the representative page with Home as the current page', async () => {
    const { element } = await openShell();
    expect(element.querySelector('nav[aria-label="Main"] [aria-current="page"]')?.textContent?.trim()).toBe('Home');
    expect(element.querySelector('h1')?.textContent).toBe('Run the event. Herald keeps the score.');
    expect(element.querySelectorAll('h3')).toHaveLength(3);
  });

  it('offers no sign-in, registration or results as working functionality', async () => {
    const { element } = await openShell();
    expect(element.querySelector('form, input')).toBeNull();
    expect(element.textContent).not.toMatch(/sign in|register|results table/i);
  });

  it('opens and closes the narrow-screen menu, and closes it after navigating', async () => {
    const { menu, fixture, navigate } = await openShell();
    expect(menu.getAttribute('aria-controls')).toBe('public-menu');
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    menu.click();
    await fixture.whenStable();
    expect(menu.getAttribute('aria-expanded')).toBe('true');

    await navigate('/?from=menu');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const { element } = await openShell();
    const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
