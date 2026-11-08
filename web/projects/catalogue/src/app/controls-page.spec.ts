import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { ControlsPage } from './controls-page';

async function render() {
  const fixture = TestBed.createComponent(ControlsPage);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('The controls page', () => {
  it('shows every button variant as default, unavailable and loading', async () => {
    const el = await render();
    for (const variant of ['primary', 'secondary', 'quiet', 'destructive']) {
      const buttons = [...el.querySelectorAll(`tbody button[data-variant=${variant}]`)] as HTMLButtonElement[];
      expect(buttons.map((b) => [b.disabled, b.getAttribute('aria-busy')])).toEqual([[false, null], [true, null], [false, 'true']]);
    }
  });

  it('runs actions only on available buttons', async () => {
    const el = await render();
    for (const button of el.querySelectorAll<HTMLButtonElement>('tbody button')) button.click();
    await new Promise((resolve) => setTimeout(resolve));
    expect(el.querySelector('[role=status]')?.textContent).toContain('Actions run: 4.');
  });

  it('has no accessibility violations', async () => {
    const el = await render();
    const { violations } = await axe.run(el, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
