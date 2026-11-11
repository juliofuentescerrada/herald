import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibilityViolations, renderHost } from './testing';
import { ToastOutlet, Toasts, toastDuration } from './toast';

@Component({ imports: [ToastOutlet], template: `<herald-toast-outlet />` })
class Host {
  readonly toasts = inject(Toasts);
}

const texts = (element: HTMLElement) => [...element.querySelectorAll('.herald-toast p')].map((p) => p.textContent);

describe('Toast', () => {
  afterEach(() => vi.useRealTimers());

  it('announces outcomes politely and leaves by itself after at least five seconds', async () => {
    const { element, fixture, host } = await renderHost(Host);
    vi.useFakeTimers();
    host.toasts.show('Ellis Stone admitted.');
    fixture.detectChanges();
    expect(element.querySelector('[role=status]')?.getAttribute('aria-live')).toBe('polite');
    expect(texts(element)).toEqual(['Ellis Stone admitted.']);
    vi.advanceTimersByTime(5000);
    expect(host.toasts.toasts().length).toBe(1);
    vi.advanceTimersByTime(toastDuration);
    expect(host.toasts.toasts().length).toBe(0);
  });

  it('stays while focused and leaves after focus moves away', async () => {
    const { element, fixture, host } = await renderHost(Host);
    vi.useFakeTimers();
    host.toasts.show('Changes saved.');
    fixture.detectChanges();
    element.querySelector('.herald-toast')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(toastDuration * 3);
    expect(host.toasts.toasts().length).toBe(1);
    element.querySelector('.herald-toast')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    vi.advanceTimersByTime(toastDuration);
    expect(host.toasts.toasts().length).toBe(0);
  });

  it('keeps at most three, the oldest leaving first', async () => {
    const { element, fixture, host } = await renderHost(Host);
    for (const text of ['One.', 'Two.', 'Three.', 'Four.']) host.toasts.show(text);
    fixture.detectChanges();
    expect(texts(element)).toEqual(['Two.', 'Three.', 'Four.']);
    host.toasts.clear();
  });

  it('can be dismissed with a named button and cleared at once', async () => {
    const { element, fixture, host } = await renderHost(Host);
    host.toasts.show('Robin Vale’s entry cancelled.');
    host.toasts.show('Changes saved.', 'info');
    fixture.detectChanges();
    const dismiss = element.querySelector<HTMLButtonElement>('.herald-toast button')!;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss notification');
    dismiss.click();
    fixture.detectChanges();
    expect(texts(element)).toEqual(['Changes saved.']);
    host.toasts.clear();
    fixture.detectChanges();
    expect(texts(element)).toEqual([]);
  });

  it('has no accessibility violations', async () => {
    const { element, fixture, host } = await renderHost(Host);
    host.toasts.show('Ellis Stone admitted.');
    fixture.detectChanges();
    expect(await accessibilityViolations(element)).toEqual([]);
    host.toasts.clear();
  });
});

describe('Toast on the server', () => {
  it('shows nothing', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: (await import('@angular/core')).PLATFORM_ID, useValue: 'server' }] });
    const { element, fixture, host } = await renderHost(Host);
    host.toasts.show('Ellis Stone admitted.');
    fixture.detectChanges();
    expect(host.toasts.toasts()).toEqual([]);
    expect(element.querySelector('[role=status]')).toBeNull();
  });
});
