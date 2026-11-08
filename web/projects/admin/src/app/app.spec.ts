import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('The admin app', () => {
  it('renders its router outlet', async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).not.toBeNull();
  });
});
