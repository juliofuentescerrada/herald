import { Component } from '@angular/core';
import { Icon } from './icon';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [Icon],
  template: `
    <herald-icon name="menu" />
    <herald-icon name="home" size="navigation" />
    <herald-icon name="alert-circle" size="metadata" label="Error" />
  `,
})
class Host {}

describe('Icon', () => {
  it('uses the sizes of the visual direction', async () => {
    const { element } = await renderHost(Host);
    expect([...element.querySelectorAll('svg')].map((svg) => svg.getAttribute('width'))).toEqual(['20', '24', '16']);
  });

  it('is hidden from assistive technology unless it has a label', async () => {
    const { element } = await renderHost(Host);
    const [menu, , error] = element.querySelectorAll('svg');
    expect(menu.getAttribute('aria-hidden')).toBe('true');
    expect(error.getAttribute('role')).toBe('img');
    expect(error.getAttribute('aria-label')).toBe('Error');
  });

  it('draws the outline family', async () => {
    const { element } = await renderHost(Host);
    expect(element.querySelector('svg')?.getAttribute('fill')).toBe('none');
  });

  it('has no accessibility violations', async () => {
    const { element } = await renderHost(Host);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
