import { Component } from '@angular/core';
import { StatusLabel } from './status-label';
import { renderHost } from './testing';

@Component({
  imports: [StatusLabel],
  template: `<herald-status-label>Draft</herald-status-label><herald-status-label tone="success">Finalised</herald-status-label>`,
})
class Host {}

describe('Status label', () => {
  it('shows its status as text with its tone', async () => {
    const { element } = await renderHost(Host);
    const labels = [...element.querySelectorAll('herald-status-label')];
    expect(labels.map((l) => [l.textContent, l.getAttribute('data-tone')])).toEqual([['Draft', 'neutral'], ['Finalised', 'success']]);
  });
});
