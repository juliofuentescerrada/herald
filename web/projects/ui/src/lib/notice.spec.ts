import { Component, signal } from '@angular/core';
import { Notice } from './notice';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [Notice],
  template: `
    <herald-notice heading="You are offline." tone="warning" iconName="wifi-off">Nothing you entered has been lost.</herald-notice>
    <herald-notice heading="The tournament could not be published." tone="danger"><p>The reference time zone is missing.</p></herald-notice>
    @if (shown()) {
      <herald-notice tone="info" [dismissible]="true" (dismissed)="shown.set(false)">You are now working in Southside Club.</herald-notice>
    }
  `,
})
class Host {
  readonly shown = signal(true);
}

describe('Notice', () => {
  it('announces danger at once and the other tones politely', async () => {
    const { element } = await renderHost(Host);
    expect([...element.querySelectorAll('herald-notice')].map((n) => n.getAttribute('role'))).toEqual(['status', 'alert', 'status']);
  });

  it('says what happened in text, not only with colour or an icon', async () => {
    const { element } = await renderHost(Host);
    expect(element.querySelector('[data-tone=danger]')?.textContent).toContain('could not be published');
  });

  it('can be dismissed with a named button', async () => {
    const { element, fixture } = await renderHost(Host);
    const dismiss = element.querySelector<HTMLButtonElement>('[data-tone=info] button')!;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');
    dismiss.click();
    await fixture.whenStable();
    expect(element.querySelector('[data-tone=info]')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { element } = await renderHost(Host);
    expect(await accessibilityViolations(element)).toEqual([]);
  });
});
