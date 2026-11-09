import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CreatedOrganisation, HeraldHostAdminService, HttpValidationProblemDetails, problemOf } from '@herald/api-client/admin';
import { RouterLink } from '@angular/router';
import { Button, Notice } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, organisationPath } from '../../platform';

/** A-1: the API applies the same rules; these are its rule codes. */
export const maxNameLength = 80;
const messages: Record<string, string> = {
  required: 'Enter an organisation name.',
  'too-long': `Use ${maxNameLength} characters or fewer.`,
};

/** Creates the person's organisation; they become its only owner and enter its workspace. */
@Component({
  selector: 'app-create-organisation-page',
  imports: [Button, Notice, RouterLink],
  templateUrl: './create-organisation-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganisationPage {
  private readonly api = inject(HeraldHostAdminService);
  /** With a working organisation, Cancel goes back to it; a newcomer has nowhere to go back to. */
  protected readonly context = inject(AppContext);
  private readonly access = inject(AccessState);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly name = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly state = signal<'editing' | 'creating' | 'failed'>('editing');
  /** D-5: one identifier per attempt, reused when the same name is sent again after a lost answer. */
  private attempt: { readonly id: string; readonly name: string } | null = null;

  constructor() {
    this.access.keepDraft(() => this.name());
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.state() === 'creating') return;
    const name = this.name().trim();
    const rule = name === '' ? 'required' : name.length > maxNameLength ? 'too-long' : null;
    if (rule) return this.invalid(rule);

    if (this.attempt?.name !== name) this.attempt = { id: crypto.randomUUID(), name };
    this.error.set(null);
    this.state.set('creating');
    try {
      const created = await firstValueFrom(this.api.createOrganisation<CreatedOrganisation>({ organisationId: this.attempt.id, name }));
      this.context.enter(`${organisationPath(created.id)}?created`);
    } catch (error) {
      // Lost access shows its own state; nothing to add here.
      if (this.access.problem()) return;
      const serverRule = problemOf<HttpValidationProblemDetails>(error)?.errors?.['name']?.[0];
      if (serverRule) {
        this.state.set('editing');
        return this.invalid(serverRule);
      }
      // A conflict means this identifier is taken by something else: the next attempt gets a new one.
      if (error instanceof HttpErrorResponse && error.status === 409) this.attempt = null;
      this.state.set('failed');
    }
  }

  private invalid(rule: string): void {
    this.error.set(messages[rule] ?? 'Check the organisation name.');
    this.input().nativeElement.focus();
  }
}
