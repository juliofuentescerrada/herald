import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';

/** Renders a host attached to the document, so focus and axe behave as in a page. */
export async function renderHost<T>(host: Type<T>) {
  const fixture = TestBed.createComponent(host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
}

/** axe-core rules that jsdom can evaluate; contrast is measured in the browser (task 3.5). */
export async function accessibilityViolations(element: Element) {
  const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
  return violations.map((violation) => violation.id);
}
