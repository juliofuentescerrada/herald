import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeraldHostAdminService } from '@herald/api-client/admin';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import axe from 'axe-core';
import { of } from 'rxjs';
import { AppContext, Session } from '../../platform';
import { OrganisationSelectorPage } from './organisation-selector-page';

const northside = '0198f000-0000-7000-8000-00000000000a';
const southside = '0198f000-0000-7000-8000-00000000000b';

async function render(current: string | null) {
  const context = { organisation: signal(current), home: signal(current ? `/organisations/${current}` : '/'), enter: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideTanStackQuery(new QueryClient()),
      { provide: AppContext, useValue: context },
      { provide: Session, useValue: { account: signal({ username: 'ana' }) } },
      {
        provide: HeraldHostAdminService,
        useValue: { getMe: () => of({ displayName: 'Ana', organisations: [{ id: northside, name: 'Northside Gaming' }, { id: southside, name: 'Southside Club' }] }) },
      },
    ],
  });
  const fixture = TestBed.createComponent(OrganisationSelectorPage);
  const element = fixture.nativeElement as HTMLElement;
  await vi.waitFor(() => expect(element.querySelectorAll('li')).toHaveLength(2));
  return { element, context, fixture };
}

describe('Choosing an organisation', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('marks the current organisation and offers to switch to the other', async () => {
    const { element } = await render(northside);
    const [first, second] = element.querySelectorAll('li');
    expect(first.textContent).toContain('Owner · Current organisation');
    expect(first.textContent).toContain('Selected');
    expect(second.querySelector('button')?.textContent?.trim()).toBe('Switch');
    expect(second.querySelector('button')?.getAttribute('aria-label')).toBe('Switch to Southside Club');
    expect([...element.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual(['Create another organisation', 'Keep current organisation']);
  });

  it('opens the chosen organisation with a full load', async () => {
    const { element, context } = await render(northside);
    element.querySelector<HTMLButtonElement>('li button')!.click();
    expect(context.enter).toHaveBeenCalledWith(`/organisations/${southside}`);
  });

  it('marks none and offers no way to keep one without a current organisation', async () => {
    const { element } = await render(null);
    expect(element.textContent).not.toContain('Selected');
    expect(element.querySelectorAll('li button')).toHaveLength(2);
    const { violations } = await axe.run(element, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
