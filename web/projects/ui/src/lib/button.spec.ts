import { Component, signal } from '@angular/core';
import { Button } from './button';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [Button],
  template: `
    <button herald-button variant="primary" [loading]="loading()" (click)="clicks = clicks + 1">Publish</button>
    <button herald-button [disabled]="true" (click)="clicks = clicks + 1">Start competition</button>
    <a herald-button href="/next">Open</a>
  `,
})
class Host {
  readonly loading = signal(false);
  clicks = 0;
}

async function render(loading = false) {
  const rendered = await renderHost(Host);
  rendered.host.loading.set(loading);
  await rendered.fixture.whenStable();
  const [publish, start] = rendered.element.querySelectorAll('button');
  return { ...rendered, publish, start, link: rendered.element.querySelector('a')! };
}

describe('Button', () => {
  it('runs its action when clicked', async () => {
    const { publish, host } = await render();
    publish.click();
    expect(host.clicks).toBe(1);
  });

  it('shows its variant', async () => {
    const { publish, start } = await render();
    expect(publish.dataset['variant']).toBe('primary');
    expect(start.dataset['variant']).toBe('secondary');
  });

  it('stays focusable and announced while loading but does not repeat the action', async () => {
    const { publish, host } = await render(true);
    publish.focus();
    expect(document.activeElement).toBe(publish);
    expect(publish.getAttribute('aria-busy')).toBe('true');
    expect(publish.getAttribute('aria-disabled')).toBe('true');
    expect(publish.textContent?.trim()).toBe('Publish');
    expect(publish.querySelector('.herald-button-spinner')?.getAttribute('aria-hidden')).toBe('true');
    publish.click();
    expect(host.clicks).toBe(0);
  });

  it('runs its action again once loading ends', async () => {
    const { publish, host, fixture } = await render(true);
    host.loading.set(false);
    await fixture.whenStable();
    publish.click();
    expect(host.clicks).toBe(1);
    expect(publish.hasAttribute('aria-busy')).toBe(false);
  });

  it('does not run its action when disabled', async () => {
    const { start, host } = await render();
    expect(start.disabled).toBe(true);
    start.click();
    expect(host.clicks).toBe(0);
  });

  it('marks keyboard focus as visible', async () => {
    const { publish, fixture } = await render();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    publish.focus();
    await fixture.whenStable();
    expect(publish.hasAttribute('data-focus-visible')).toBe(true);
  });

  it('renders a link with the same appearance', async () => {
    const { link } = await render();
    expect(link.classList).toContain('herald-button');
    expect(link.getAttribute('href')).toBe('/next');
  });

  it('has no accessibility violations', async () => {
    const { element } = await render(true);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
