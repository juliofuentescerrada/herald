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

  it('opens each dialog state as a real modal and closes it on Escape', async () => {
    const el = await render();
    const open = (section: string, label: string) =>
      [...el.querySelectorAll<HTMLButtonElement>(`section[aria-labelledby=${section}] button`)].find((b) => b.textContent?.trim() === label)!.click();
    open('dialogs', 'With an error inside');
    await vi.waitFor(() => expect(document.querySelector('[role=dialog]')?.textContent).toContain('Entry was not cancelled'));
    document.querySelector('[role=dialog]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('[role=dialog]')).toBeNull());
    open('drawers', 'Busy');
    await vi.waitFor(() => expect(document.querySelector('herald-drawer [aria-busy=true]')).not.toBeNull());
  });

  it('shows toasts in one stack of at most three', async () => {
    const el = await render();
    [...el.querySelectorAll<HTMLButtonElement>('section[aria-labelledby=toasts] button')].find((b) => b.textContent?.includes('Three'))!.click();
    await new Promise((resolve) => setTimeout(resolve));
    expect([...document.querySelectorAll('.herald-toast p')].map((p) => p.textContent)).toEqual([
      'Ellis Stone admitted.',
      'Robin Vale’s entry cancelled.',
      'Changes saved.',
    ]);
  });

  it('has no accessibility violations', async () => {
    const el = await render();
    const { violations } = await axe.run(el, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
