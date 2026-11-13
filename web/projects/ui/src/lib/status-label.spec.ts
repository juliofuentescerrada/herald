import { Component } from '@angular/core';
import { StatusLabel } from './status-label';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [StatusLabel],
  template: `<herald-status-label>Draft</herald-status-label><herald-status-label tone="success" icon="circle-check">Checked in</herald-status-label>`,
})
class Host {}

describe('Status label', () => {
  it('shows its status as text with its tone', async () => {
    const { element } = await renderHost(Host);
    const labels = [...element.querySelectorAll('herald-status-label')];
    expect(labels.map((l) => [l.textContent, l.getAttribute('data-tone')])).toEqual([['Draft', 'neutral'], ['Checked in', 'success']]);
  });

  it('shows the icon it is given before its text, at the metadata size, hidden from assistive technology', async () => {
    const { element } = await renderHost(Host);
    const [draft, checkedIn] = element.querySelectorAll('herald-status-label');
    expect(draft.querySelector('herald-icon')).toBeNull();
    const icon = checkedIn.firstElementChild!;
    expect(icon.getAttribute('data-icon')).toBe('circle-check');
    expect(icon.querySelector('svg')?.getAttribute('width')).toBe('16');
    expect(icon.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const { element } = await renderHost(Host);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
