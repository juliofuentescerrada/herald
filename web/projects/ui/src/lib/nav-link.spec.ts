import { Component } from '@angular/core';
import { NavLink } from './nav-link';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [NavLink],
  template: `<nav aria-label="Workspace"><a herald-nav-link href="/" aria-current="page">Overview</a><a herald-nav-link href="/t">Tournaments</a></nav>`,
})
class Host {}

describe('Navigation link', () => {
  it('keeps the current page mark the app sets', async () => {
    const { element } = await renderHost(Host);
    expect(element.querySelector('[aria-current=page]')?.textContent).toBe('Overview');
  });

  it('has no accessibility violations', async () => {
    const { element } = await renderHost(Host);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
