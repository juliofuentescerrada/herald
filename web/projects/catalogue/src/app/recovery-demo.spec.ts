import { TestBed } from '@angular/core/testing';
import { RecoveryDemo } from './recovery-demo';

describe('The recovery demo', () => {
  it('explains a failure, keeps the entry and succeeds on retry', async () => {
    const fixture = TestBed.createComponent(RecoveryDemo);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    const input = el.querySelector('input')!;
    input.value = 'Autumn cup';
    input.dispatchEvent(new Event('input'));
    const publish = el.querySelector('button')!;

    publish.click();
    await fixture.whenStable();
    expect(publish.getAttribute('aria-busy')).toBe('true');
    await vi.waitFor(() => expect(el.querySelector('[role=alert]')?.textContent).toContain('could not be published'));
    expect(input.value).toBe('Autumn cup');

    publish.click();
    await vi.waitFor(() => expect(el.textContent).toContain('“Autumn cup” is published.'));
    expect(el.querySelector('[role=alert]')).toBeNull();
  });
});
