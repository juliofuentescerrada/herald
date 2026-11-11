import { Component, ElementRef, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { Button } from './button';
import { Dialog, DialogContext, Dialogs, Drawer } from './dialog';
import { accessibilityViolations, renderHost } from './testing';

@Component({
  imports: [Dialog, Drawer, Button],
  template: `
    <button herald-button #opener type="button" (click)="openDialog()">Cancel entry</button>
    <ng-template #cancel let-close="close">
      <herald-dialog heading="Cancel Robin Vale’s entry?" [busy]="busy()">
        <p>This cancellation is final for this entry.</p>
        <div heraldDialogActions>
          <button herald-button variant="destructive" type="button" [loading]="busy()" (click)="confirmed = confirmed + 1">Confirm cancellation</button>
          <button herald-button type="button" data-herald-initial-focus [disabled]="busy()" (click)="close()">Keep entry</button>
        </div>
      </herald-dialog>
    </ng-template>
    <ng-template #add let-close="close">
      <herald-drawer heading="Add player">
        <label for="search">Search by name</label>
        <input id="search" />
        <div heraldDialogActions><button herald-button type="button" (click)="close()">Back to entries</button></div>
      </herald-drawer>
    </ng-template>
  `,
})
class Host {
  readonly dialogs = inject(Dialogs);
  readonly viewContainerRef = inject(ViewContainerRef);
  readonly busy = signal(false);
  confirmed = 0;
  readonly opener = viewChild.required('opener', { read: ElementRef<HTMLElement> });
  readonly cancel = viewChild.required<TemplateRef<DialogContext>>('cancel');
  readonly add = viewChild.required<TemplateRef<DialogContext>>('add');

  openDialog() {
    return this.dialogs.open(this.cancel(), { trigger: this.opener().nativeElement, viewContainerRef: this.viewContainerRef });
  }
}

const panel = () => document.querySelector<HTMLElement>('[role=dialog]');
const escape = () => panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

describe('Dialog', () => {
  afterEach(() => document.querySelectorAll('herald-dialog, herald-drawer').forEach((el) => el.remove()));

  it('is a modal titled by its question, with focus on the marked leaving action', async () => {
    const { host, fixture } = await renderHost(Host);
    host.opener().nativeElement.focus();
    host.openDialog();
    await fixture.whenStable();
    expect(panel()?.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(panel()!.getAttribute('aria-labelledby')!)?.textContent).toContain('Cancel Robin Vale’s entry?');
    await vi.waitFor(() => expect(document.activeElement?.textContent).toContain('Keep entry'));
  });

  it('closes on Escape without a change and returns focus to its opener', async () => {
    const { host, fixture } = await renderHost(Host);
    host.opener().nativeElement.focus();
    const ref = host.openDialog();
    await fixture.whenStable();
    escape();
    await ref.closed;
    expect(panel()).toBeNull();
    expect(host.confirmed).toBe(0);
    await vi.waitFor(() => expect(document.activeElement).toBe(host.opener().nativeElement));
  });

  it('stays open and does not repeat its request while busy', async () => {
    const { host, fixture } = await renderHost(Host);
    host.openDialog();
    host.busy.set(true);
    await fixture.whenStable();
    escape();
    const confirm = [...panel()!.querySelectorAll('button')].find((b) => b.textContent?.includes('Confirm'))!;
    confirm.click();
    await fixture.whenStable();
    expect(panel()).not.toBeNull();
    expect(panel()!.getAttribute('aria-busy')).toBe('true');
    expect(host.confirmed).toBe(0);
  });

  it('confirm resolves true only for the confirming action', async () => {
    const { host, fixture } = await renderHost(Host);
    const answer = host.dialogs.confirm({ heading: 'Leave this page?', body: 'Your input is lost.', confirmLabel: 'Leave', leaveLabel: 'Stay on this page', destructive: true });
    await fixture.whenStable();
    [...panel()!.querySelectorAll('button')].find((b) => b.textContent?.includes('Stay'))!.click();
    expect(await answer).toBe(false);
    const again = host.dialogs.confirm({ heading: 'Leave this page?', body: 'Your input is lost.', confirmLabel: 'Leave', leaveLabel: 'Stay on this page' });
    await fixture.whenStable();
    [...panel()!.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Leave')!.click();
    expect(await again).toBe(true);
  });

  it('opens a drawer at the side with the same focus rules', async () => {
    const { host, fixture } = await renderHost(Host);
    host.dialogs.open(host.add(), { viewContainerRef: host.viewContainerRef });
    await fixture.whenStable();
    expect(document.querySelector('herald-drawer')?.getAttribute('data-placement')).toBe('side');
    await vi.waitFor(() => expect(panel()!.contains(document.activeElement)).toBe(true));
  });

  it('has no accessibility violations', async () => {
    const { host, fixture } = await renderHost(Host);
    host.openDialog();
    await fixture.whenStable();
    expect(await accessibilityViolations(document.querySelector('herald-dialog')!)).toEqual([]);
  });
});
