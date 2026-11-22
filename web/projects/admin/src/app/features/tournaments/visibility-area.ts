import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { HeraldHostAdminService, PublicPreview, TournamentDetails } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Notice, StatusLabel, Toasts } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState, AUTH_CONFIG, CONFIRM } from '../../platform';
import { dateTimeText } from './tournaments';

type Visible = 'public' | 'unlisted';

const names: Record<string, string> = { public: 'Public', unlisted: 'Unlisted', private: 'Private' };

/**
 * A published tournament's visibility (h1-public-read D-3, D-5): the current value, "Change visibility" and, while visitors can
 * read it, "View public page". Making it private asks for a confirmation; making it public or unlisted first previews what becomes
 * public, from the public page's own model.
 */
@Component({
  selector: 'app-visibility-area',
  imports: [Button, Dialog, Notice, StatusLabel],
  template: `
    <section class="summary" aria-labelledby="visibility-heading">
      <div>
        <div class="title">
          <h2 id="visibility-heading">Visibility</h2>
          <herald-status-label>{{ name() }}</herald-status-label>
        </div>
        <p class="help">
          @if (visible()) {
            Anyone with the link can read the details, rounds and standings, with aliases only. Without a directory in H1, public and unlisted both open by link.
          } @else {
            Only the organisation can read this tournament.
          }
        </p>
      </div>
      <div class="row-actions" [attr.aria-describedby]="unsaved() ? 'visibility-unsaved' : null">
        @if (unsaved()) {
          <p class="help" id="visibility-unsaved">Save your changes first.</p>
        } @else {
          <button herald-button type="button" [loading]="busy()" (click)="change($any($event.currentTarget))">Change visibility</button>
          @if (visible()) {
            <a herald-button variant="quiet" [href]="publicPage()">View public page</a>
          }
        }
      </div>
    </section>
    @if (failure(); as failed) {
      <herald-notice tone="danger" heading="Visibility not changed">{{ failed }}</herald-notice>
    }

    <ng-template #previewDialog>
      <herald-dialog [heading]="'Make ' + tournament().configuration.title + ' public?'" [busy]="busy()">
        <p>Anyone with the link will read what follows. Contacts, reasons, rosters and lineups are never shown.</p>
        @if (preview(); as shown) {
          <section class="preview" aria-labelledby="preview-heading">
            <h3 id="preview-heading">What becomes public</h3>
            <dl class="facts">
              <dt>Title</dt><dd>{{ shown.page.title }}</dd>
              <dt>Dates</dt><dd>{{ datesText(shown) }}</dd>
              <dt>Entrant aliases</dt><dd>{{ shown.aliases.length ? shown.aliases.join(', ') : 'None yet: the page names entrants once the schedule is published' }}</dd>
              <dt>Also</dt><dd>Published rounds, results with their causes, standings, public changes</dd>
            </dl>
          </section>
          <fieldset class="choice">
            <legend>Visibility</legend>
            <label><input type="radio" name="visibility" [checked]="choice() === 'public'" (change)="choice.set('public')" [disabled]="busy()" /> Public</label>
            <label><input type="radio" name="visibility" [checked]="choice() === 'unlisted'" (change)="choice.set('unlisted')" [disabled]="busy()" /> Unlisted (in H1, also by link only)</label>
          </fieldset>
        } @else if (previewFailed()) {
          <herald-notice tone="danger" heading="The preview could not be loaded">Nothing changed. Close this dialog and try again.</herald-notice>
        } @else {
          <p role="status">Loading the preview…</p>
        }
        @if (dialogFailure(); as failed) {
          <herald-notice tone="danger" heading="Visibility not changed">{{ failed }}</herald-notice>
        }
        <div class="actions">
          <button herald-button variant="primary" type="button" [loading]="busy()" [disabled]="!preview()" (click)="save(choice())">
            {{ busy() ? 'Saving…' : choice() === 'public' ? 'Make public' : 'Make unlisted' }}
          </button>
          <button herald-button type="button" data-herald-initial-focus [disabled]="busy()" (click)="closeDialog()">Keep private</button>
        </div>
      </herald-dialog>
    </ng-template>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--herald-space-4); }
    .summary { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--herald-space-4); padding: var(--herald-space-6);
      background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    .title { display: flex; flex-wrap: wrap; align-items: center; gap: var(--herald-space-2) var(--herald-space-4); margin: 0 0 var(--herald-space-2); }
    h2 { font-size: 20px; margin: 0; }
    .help { color: var(--herald-color-text-secondary); margin: 0; max-inline-size: 75ch; }
    .row-actions { display: flex; flex-wrap: wrap; gap: var(--herald-space-3); justify-content: flex-end; }
    .preview { margin: var(--herald-space-4) 0; padding: var(--herald-space-4); border: 1px solid var(--herald-color-border-default); }
    .preview h3 { font-size: 16px; margin: 0 0 var(--herald-space-2); }
    .facts { display: grid; grid-template-columns: max-content 1fr; gap: var(--herald-space-2) var(--herald-space-4); margin: 0; }
    .facts dt { color: var(--herald-color-text-secondary); }
    .facts dd { margin: 0; }
    .choice { display: grid; gap: var(--herald-space-2); border: 0; margin: 0; padding: 0; }
    .choice legend { font-weight: 700; margin-bottom: var(--herald-space-2); }
    .actions { display: flex; flex-wrap: wrap; gap: var(--herald-space-3); margin-top: var(--herald-space-4); }
    herald-notice { display: flex; margin-top: var(--herald-space-3); }
    @media (max-width: 699px) { .summary { flex-direction: column; } .row-actions { justify-content: flex-start; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityArea {
  private readonly api = inject(HeraldHostAdminService);
  private readonly access = inject(AccessState);
  private readonly confirm = inject(CONFIRM);
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly publicUrl = inject(AUTH_CONFIG, { optional: true })?.publicUrl ?? '';
  private readonly previewDialog = viewChild.required<TemplateRef<DialogContext>>('previewDialog');
  private openDialog: DialogRef | null = null;

  readonly organisation = input.required<string>();
  readonly tournament = input.required<TournamentDetails>();
  /** The configuration form has unsaved changes: a change here would replace them, so it waits. */
  readonly unsaved = input(false);
  readonly changed = output<TournamentDetails>();

  protected readonly busy = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly dialogFailure = signal<string | null>(null);
  protected readonly preview = signal<PublicPreview | null>(null);
  protected readonly previewFailed = signal(false);
  protected readonly choice = signal<Visible>('public');

  protected readonly visible = computed(() => ['public', 'unlisted'].includes(this.tournament().configuration.visibility ?? ''));
  protected readonly name = computed(() => names[this.tournament().configuration.visibility ?? ''] ?? 'Not set');
  protected readonly publicPage = computed(() => `${this.publicUrl.replace(/\/$/, '')}/tournaments/${this.tournament().id}`);

  protected datesText(preview: PublicPreview): string {
    const page = preview.page;
    return page.plannedStartAt ? `${dateTimeText(page.plannedStartAt)} · ${page.timeZone}` : 'Planned start not set';
  }

  protected async change(trigger: HTMLElement): Promise<void> {
    if (this.busy()) return;
    this.failure.set(null);
    if (this.visible()) {
      const t = this.tournament();
      const confirmed = await this.confirm({
        heading: `Make ${t.configuration.title} private?`,
        body: 'Visitors with the link see “not available” from the moment you confirm. Copies already seen cannot be retracted.',
        confirmLabel: 'Make private',
        leaveLabel: `Keep it ${this.name().toLowerCase()}`,
      });
      if (confirmed) await this.save('private');
      return;
    }
    this.preview.set(null);
    this.previewFailed.set(false);
    this.dialogFailure.set(null);
    this.choice.set('public');
    const open = this.dialogs.open(this.previewDialog(), { trigger, viewContainerRef: this.viewContainerRef });
    this.openDialog = open;
    void open.closed.then(() => {
      if (this.openDialog === open) this.openDialog = null;
    });
    try {
      this.preview.set(await firstValueFrom(this.api.getPublicPreview(this.organisation(), this.tournament().id)));
    } catch {
      if (!this.access.problem()) this.previewFailed.set(true);
    }
  }

  protected closeDialog(): void {
    this.openDialog?.close();
  }

  protected async save(visibility: Visible | 'private'): Promise<void> {
    if (this.busy()) return;
    const t = this.tournament();
    this.busy.set(true);
    this.dialogFailure.set(null);
    try {
      const answer = await firstValueFrom(this.api.changeVisibility(this.organisation(), t.id, { visibility, expectedRevision: t.revision }));
      this.changed.emit(answer);
      this.toasts.show(`${t.configuration.title} is ${names[visibility].toLowerCase()}.`);
      this.closeDialog();
    } catch (error) {
      if (this.access.problem()) return;
      const message = error instanceof HttpErrorResponse && error.status === 409
        ? 'The tournament changed elsewhere. Nothing changed. Reload the latest version and try again.'
        : 'The request failed. Nothing changed. Try again.';
      if (this.openDialog) this.dialogFailure.set(message);
      else this.failure.set(message);
    } finally {
      this.busy.set(false);
    }
  }
}
