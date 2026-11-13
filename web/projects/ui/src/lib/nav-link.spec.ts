import { Component } from '@angular/core';
import { NavLink } from './nav-link';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [NavLink],
  template: `<nav aria-label="Workspace"><a herald-nav-link href="/" aria-current="page">Overview</a><a herald-nav-link href="/t" icon="trophy">Tournaments</a></nav>`,
})
class Host {}

describe('Navigation link', () => {
  it('keeps the current page mark the app sets', async () => {
    const { element } = await renderHost(Host);
    expect(element.querySelector('[aria-current=page]')?.textContent).toBe('Overview');
  });

  it('shows the icon it is given before its text, at the navigation size, keeping the text as its name', async () => {
    const { element } = await renderHost(Host);
    const [overview, tournaments] = element.querySelectorAll('a');
    expect(overview.querySelector('herald-icon')).toBeNull();
    expect(tournaments.firstElementChild?.getAttribute('data-icon')).toBe('trophy');
    expect(tournaments.querySelector('svg')?.getAttribute('width')).toBe('24');
    expect(tournaments.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(tournaments.textContent).toBe('Tournaments');
  });

  it('has no accessibility violations', async () => {
    const { element } = await renderHost(Host);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
