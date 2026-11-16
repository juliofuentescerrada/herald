import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { HeraldHostAdminService, HttpValidationProblemDetails, problemOf, ScheduleDetails, TournamentDetails } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, Toasts } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AccessState, CONFIRM, scheduleKey } from '../../platform';
import { dateTimeText, instantText } from './tournaments';

type DateName = 'registrationOpensAt' | 'registrationClosesAt' | 'plannedStartAt';

const dateNames: readonly DateName[] = ['registrationOpensAt', 'registrationClosesAt', 'plannedStartAt'];
const dateLabels: Record<DateName, string> = {
  registrationOpensAt: 'Registration opens',
  registrationClosesAt: 'Registration closes',
  plannedStartAt: 'Planned start',
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** A rejected date change in words, naming both dates of a broken order (§5.2). */
export const datesRuleText = (field: string, rule: string, planned: string): string => {
  switch (rule) {
    case 'not-after-opening': return 'Registration closes at or before it opens. Move the closure after the opening.';
    case 'after-planned-start': return `Registration closes after the planned start. Move the closure to or before ${planned}.`;
    case 'skipped-hour': return `${dateLabels[field as DateName] ?? 'A date'} falls in an hour the time zone skips. Choose another time.`;
    case 'competition-started': return 'The competition has started: dates are fixed.';
    case 'cancelled': return 'The tournament is cancelled. Nothing can change.';
    default: return 'The dates could not be changed.';
  }
};

/**
 * The tournament's lifecycle actions beside its summary (h1-tournament-cancel-and-dates D-6): "Change dates" before start,
 * "Cancel tournament", "Archive" or "Unarchive" once terminal, and "Delete draft" for a draft. A cancelled tournament
 * shows when and by whom, and that nothing can change.
 */
@Component({
  selector: 'app-lifecycle-area',
  imports: [Button, Dialog, Icon, Notice],
  template: `
    <section class="summary" aria-labelledby="lifecycle-heading">
      <div>
        <h2 id="lifecycle-heading">{{ heading() }}</h2>
        <p class="help">{{ summary() }}</p>
      </div>
      <div class="row-actions" [attr.aria-describedby]="unsaved() ? 'lifecycle-unsaved' : null">
        @if (unsaved()) {
          <p class="help" id="lifecycle-unsaved">Save your changes first.</p>
        } @else if (draft()) {
          <button herald-button variant="destructive" type="button" [loading]="busy() === 'delete'" (click)="deleteDraft()">Delete draft</button>
        } @else if (terminal()) {
          <button herald-button type="button" [loading]="busy() === 'archive'" (click)="archive()">{{ tournament().archived ? 'Unarchive' : 'Archive' }}</button>
        } @else {
          @if (!started()) {
            <button herald-button type="button" (click)="askDates($any($event.currentTarget))">Change dates</button>
          }
          <button herald-button variant="destructive" type="button" (click)="askCancel($any($event.currentTarget))">Cancel tournament</button>
        }
      </div>
    </section>
    @if (cancellation(); as cancelled) {
      <herald-notice tone="danger" heading="This tournament is cancelled">
        {{ cancelledText() }}
        {{ cancelled.afterStart ? 'Results recorded before stay; unresolved matches were voided with no points. No champion is declared.' : 'Its entries were cancelled and a published schedule withdrawn.' }}
        A replacement is a new tournament.
      </herald-notice>
    }
    @if (failure(); as failed) {
      <herald-notice tone="danger" heading="Nothing changed">{{ failed }}</herald-notice>
    }

    <ng-template #datesDialog>
      <herald-dialog heading="Change dates" [busy]="busy() === 'dates'">
        <p>Select the dates to change. The others stay as they are. Time zone: {{ zone() }}.</p>
        <form novalidate (submit)="$event.preventDefault(); saveDates()">
          @for (name of dateNames; track name) {
            <div class="date-row">
              <label><input type="checkbox" [checked]="selected().has(name)" [disabled]="busy() === 'dates'" (change)="toggle(name)" [attr.aria-describedby]="name + '-now'" /> {{ dateLabels[name] }}</label>
              <p class="help" [id]="name + '-now'">Now: {{ current(name) }}</p>
              @if (selected().has(name)) {
                <div class="field">
                  <label [for]="name + '-new'">New {{ dateLabels[name].toLowerCase() }}</label>
                  <input
                    [id]="name + '-new'"
                    type="datetime-local"
                    #dateInput
                    [value]="values()[name]"
                    [readOnly]="busy() === 'dates'"
                    (input)="setDate(name, dateInput.value)"
                    [attr.aria-invalid]="datesError() ? 'true' : null"
                    [attr.aria-describedby]="datesError() ? 'dates-error' : null"
                  />
                </div>
              }
            </div>
          }
          @if (datesError(); as message) {
            <p class="field-error" id="dates-error"><herald-icon name="alert-circle" size="metadata" />Error: {{ message }}</p>
          }
          @if (changes().length) {
            <section class="preview" aria-labelledby="dates-preview">
              <h3 id="dates-preview">Preview</h3>
              <ul>
                @for (change of changes(); track change.name) {
                  <li>{{ dateLabels[change.name] }}: {{ change.from }} → {{ change.to }}</li>
                }
              </ul>
              <p class="help">{{ zone() }}. Only the selected dates change. Check-ins stay as they are; tell your guests through your usual channels.</p>
            </section>
          }
          <div class="actions">
            <button herald-button variant="primary" type="submit" [loading]="busy() === 'dates'" [disabled]="!changes().length">{{ busy() === 'dates' ? 'Saving…' : 'Save dates' }}</button>
            <button herald-button type="button" data-herald-initial-focus [disabled]="busy() === 'dates'" (click)="closeDialog()">Keep as it is</button>
          </div>
        </form>
      </herald-dialog>
    </ng-template>

    <ng-template #cancelDialog>
      <herald-dialog [heading]="'Cancel ' + tournament().configuration.title + '?'" [busy]="busy() === 'cancel'">
        <p>{{ consequence() }} This cannot be undone: a replacement is a new tournament.</p>
        <form novalidate (submit)="$event.preventDefault(); cancel()">
          <div class="field">
            <label for="cancel-reason">Reason (required)</label>
            <textarea
              id="cancel-reason"
              #cancelReason
              rows="3"
              maxlength="500"
              [value]="reason()"
              (input)="reason.set(cancelReason.value); reasonError.set(null)"
              [readOnly]="busy() === 'cancel'"
              [attr.aria-invalid]="reasonError() ? 'true' : null"
              [attr.aria-describedby]="reasonError() ? 'cancel-reason-help cancel-reason-error' : 'cancel-reason-help'"
            ></textarea>
            <p class="help" id="cancel-reason-help">Private to the organisation. At most 500 characters.</p>
            @if (reasonError(); as message) {
              <p class="field-error" id="cancel-reason-error"><herald-icon name="alert-circle" size="metadata" />Error: {{ message }}</p>
            }
          </div>
          @if (dialogFailure(); as failed) {
            <herald-notice tone="danger" heading="The tournament was not cancelled">{{ failed }}</herald-notice>
          }
          <div class="actions">
            <button herald-button variant="destructive" type="submit" [loading]="busy() === 'cancel'">{{ busy() === 'cancel' ? 'Cancelling…' : 'Cancel tournament' }}</button>
            <button herald-button type="button" data-herald-initial-focus [disabled]="busy() === 'cancel'" (click)="closeDialog()">Keep the tournament</button>
          </div>
        </form>
      </herald-dialog>
    </ng-template>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--herald-space-4); }
    .summary { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--herald-space-4); padding: var(--herald-space-6);
      background: var(--herald-color-surface-default); border: 1px solid var(--herald-color-border-default); }
    h2 { font-size: 20px; margin: 0 0 var(--herald-space-2); }
    .help { color: var(--herald-color-text-secondary); margin: 0; max-inline-size: 75ch; }
    .row-actions { display: flex; flex-wrap: wrap; gap: var(--herald-space-3); justify-content: flex-end; }
    .date-row { display: grid; gap: var(--herald-space-1); padding: var(--herald-space-3) 0; border-bottom: 1px solid var(--herald-color-border-default); }
    .field { display: grid; gap: var(--herald-space-1); margin-top: var(--herald-space-2); }
    .preview { margin-top: var(--herald-space-4); }
    .preview h3 { font-size: 16px; margin: 0 0 var(--herald-space-2); }
    .preview ul { margin: 0 0 var(--herald-space-2); padding-left: var(--herald-space-6); }
    .actions { display: flex; flex-wrap: wrap; gap: var(--herald-space-3); margin-top: var(--herald-space-4); }
    .field-error { display: flex; gap: var(--herald-space-2); align-items: center; color: var(--herald-color-feedback-danger-text); margin: var(--herald-space-2) 0 0; }
    herald-notice { display: flex; margin-top: var(--herald-space-3); }
    @media (max-width: 699px) { .summary { flex-direction: column; } .row-actions { justify-content: flex-start; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifecycleArea {
  private readonly api = inject(HeraldHostAdminService);
  private readonly access = inject(AccessState);
  private readonly confirm = inject(CONFIRM);
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly datesDialog = viewChild.required<TemplateRef<DialogContext>>('datesDialog');
  private readonly cancelDialog = viewChild.required<TemplateRef<DialogContext>>('cancelDialog');
  private openDialog: DialogRef | null = null;

  readonly organisation = input.required<string>();
  readonly tournament = input.required<TournamentDetails>();
  /** The configuration form has unsaved changes: an action here would replace them, so it waits. */
  readonly unsaved = input(false);
  readonly changed = output<TournamentDetails>();
  readonly deleted = output<void>();

  protected readonly dateNames = dateNames;
  protected readonly dateLabels = dateLabels;
  protected readonly busy = signal<'dates' | 'cancel' | 'archive' | 'delete' | null>(null);
  protected readonly failure = signal<string | null>(null);
  protected readonly dialogFailure = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonError = signal<string | null>(null);
  protected readonly selected = signal<ReadonlySet<DateName>>(new Set());
  protected readonly values = signal<Record<DateName, string>>({ registrationOpensAt: '', registrationClosesAt: '', plannedStartAt: '' });
  protected readonly datesError = signal<string | null>(null);
  /** The matches a cancellation after start would void, read when its confirmation opens; Query owns them. */
  private readonly confirmingAfterStart = signal(false);
  private readonly schedule = injectQuery(() => ({
    queryKey: scheduleKey(this.organisation(), this.tournament().id),
    queryFn: () => firstValueFrom(this.api.getSchedule<ScheduleDetails>(this.organisation(), this.tournament().id)),
    enabled: this.confirmingAfterStart(),
    retry: false,
  }));

  protected readonly draft = computed(() => this.tournament().publication === 'draft');
  protected readonly started = computed(() => this.tournament().start.startedAt != null);
  protected readonly terminal = computed(() => ['finalised', 'cancelled'].includes(this.tournament().competition));
  protected readonly cancellation = computed(() => this.tournament().cancellation ?? null);
  protected readonly zone = computed(() => this.tournament().configuration.timeZone ?? 'UTC');

  protected readonly heading = computed(() => {
    if (this.draft()) return 'Draft · not published';
    if (this.cancellation()) return 'Cancelled';
    if (this.tournament().competition === 'finalised') return 'Finalised';
    const startedAt = this.tournament().start.startedAt;
    return startedAt ? `Running since ${instantText(startedAt, this.zone())} · ${this.zone()}` : 'Published · before start';
  });

  protected readonly cancelledText = computed(() => {
    const cancelled = this.cancellation();
    if (!cancelled) return '';
    const by = cancelled.cancelledByName ? `by ${cancelled.cancelledByName}, ` : '';
    return `Cancelled ${by}${instantText(cancelled.cancelledAt, this.zone())} · ${this.zone()}. Reason: ${cancelled.reason}. Nothing can change.`;
  });

  protected readonly summary = computed(() => {
    if (this.draft()) return 'Never published: it can be deleted permanently.';
    if (this.cancellation()) return this.tournament().archived ? 'Archived: hidden from the tournament list unless “Show archived” is chosen.' : 'Archive it to hide it from the tournament list.';
    if (this.terminal()) return this.tournament().archived ? 'Archived: hidden from the tournament list unless “Show archived” is chosen. Unarchive it before reopening.' : 'Archive it to hide it from the tournament list.';
    return this.started() ? 'The dates are fixed now the competition has started.' : 'Change dates through “Change dates”; only the dates you select change.';
  });

  /** The cancel confirmation's consequence in words (D-6). */
  protected readonly consequence = computed(() => {
    const t = this.tournament();
    if (!this.started()) {
      const entries = t.admittedEntries + t.waitingEntries
        ? `${plural(t.admittedEntries, 'admitted', 'admitted')} and ${plural(t.waitingEntries, 'waiting entry', 'waiting entries')} will be cancelled; nobody is promoted.`
        : 'It has no entries.';
      return `Registration closes. ${entries}${t.schedulePublished ? ' The published schedule is withdrawn.' : ''}`;
    }
    if (this.schedule.isError()) return 'The matches could not be read: results recorded so far stay, unresolved matches will be voided with no points, and no champion or final ranking is declared.';
    if (!this.schedule.data()) return 'Reading the matches…';
    const matches = this.schedule.data()!.matches;
    const unresolved = matches.filter((match) => match.state !== 'resolved').length;
    return `${plural(matches.length - unresolved, 'result', 'results')} recorded so far stay. ${plural(unresolved, 'unresolved match', 'unresolved matches')} will be voided with no points. No champion or final ranking is declared.`;
  });

  protected readonly changes = computed(() => {
    const values = this.values();
    return dateNames
      .filter((name) => this.selected().has(name) && values[name] && values[name] !== this.local(name))
      .map((name) => ({ name, from: this.current(name), to: dateTimeText(values[name]) }));
  });

  protected current(name: DateName): string {
    return dateTimeText(this.tournament().configuration[name]) || 'Not set';
  }

  private local(name: DateName): string {
    return this.tournament().configuration[name]?.slice(0, 16) ?? '';
  }

  protected toggle(name: DateName): void {
    const next = new Set(this.selected());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.selected.set(next);
    this.datesError.set(null);
  }

  protected setDate(name: DateName, value: string): void {
    this.values.update((values) => ({ ...values, [name]: value }));
    this.datesError.set(null);
  }

  protected askDates(trigger: HTMLElement): void {
    this.selected.set(new Set());
    this.values.set({ registrationOpensAt: this.local('registrationOpensAt'), registrationClosesAt: this.local('registrationClosesAt'), plannedStartAt: this.local('plannedStartAt') });
    this.datesError.set(null);
    this.open(this.datesDialog(), trigger);
  }

  protected askCancel(trigger: HTMLElement): void {
    this.reason.set('');
    this.reasonError.set(null);
    this.dialogFailure.set(null);
    if (this.started()) {
      this.confirmingAfterStart.set(true);
      void this.schedule.refetch();
    }
    this.open(this.cancelDialog(), trigger);
  }

  protected closeDialog(): void {
    this.openDialog?.close();
  }

  /** Only the selected dates are sent; the server keeps the old and new values (D-5). */
  protected async saveDates(): Promise<void> {
    if (this.busy() || !this.changes().length) return;
    const t = this.tournament();
    const body = Object.fromEntries(this.changes().map(({ name }) => [name, `${this.values()[name]}:00`]));
    this.busy.set('dates');
    try {
      const answer = await firstValueFrom(this.api.changeDates(this.organisation(), t.id, { expectedRevision: t.revision, ...body }));
      this.changed.emit(answer);
      this.toasts.show('Dates changed.');
      this.closeDialog();
    } catch (error) {
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
      const planned = dateTimeText(this.selected().has('plannedStartAt') ? this.values().plannedStartAt : t.configuration.plannedStartAt);
      this.datesError.set(
        field ? datesRuleText(field, (rules as string[])[0], planned)
          : status === 409 ? 'The tournament changed elsewhere. Nothing changed. Close this dialog and reload the latest version.'
          : 'The request failed. Nothing changed. Try again.',
      );
    } finally {
      this.busy.set(null);
    }
  }

  /** Final, with a required private reason (§5.1). */
  protected async cancel(): Promise<void> {
    const reason = this.reason().trim();
    if (this.busy()) return;
    if (!reason) {
      this.reasonError.set('Enter why the tournament is cancelled.');
      return;
    }
    const t = this.tournament();
    this.busy.set('cancel');
    this.dialogFailure.set(null);
    try {
      const answer = await firstValueFrom(this.api.cancelTournament(this.organisation(), t.id, { reason, expectedRevision: t.revision }));
      this.changed.emit(answer);
      this.toasts.show(`${t.configuration.title} cancelled.`);
      this.closeDialog();
    } catch (error) {
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const errors = (status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {};
      if (errors['reason']) this.reasonError.set(errors['reason'][0] === 'too-long' ? 'Use at most 500 characters.' : 'Enter why the tournament is cancelled.');
      else if (errors['competition']) this.dialogFailure.set('The competition is finalised: it cannot be cancelled. Nothing changed.');
      else if (status === 409) this.dialogFailure.set('The tournament changed elsewhere. Nothing changed. Close this dialog and reload the latest version.');
      else this.dialogFailure.set('The request failed. Nothing changed. Try again.');
    } finally {
      this.busy.set(null);
    }
  }

  /** Reversible, so it asks nothing (A-2). */
  protected async archive(): Promise<void> {
    if (this.busy()) return;
    const t = this.tournament();
    const archived = !t.archived;
    this.busy.set('archive');
    this.failure.set(null);
    try {
      const body = { expectedRevision: t.revision };
      const answer = await firstValueFrom(archived ? this.api.archiveTournament(this.organisation(), t.id, body) : this.api.unarchiveTournament(this.organisation(), t.id, body));
      this.changed.emit(answer);
      this.toasts.show(archived ? `${t.configuration.title} archived. It is hidden from the list unless “Show archived” is chosen.` : `${t.configuration.title} unarchived.`);
    } catch (error) {
      if (this.access.problem()) return;
      this.failure.set(error instanceof HttpErrorResponse && error.status === 409
        ? 'The tournament changed elsewhere. Reload the latest version and try again.'
        : `The tournament was not ${archived ? 'archived' : 'unarchived'}. Try again.`);
    } finally {
      this.busy.set(null);
    }
  }

  /** Permanent, after a confirmation; nothing of the draft remains (D-4). */
  protected async deleteDraft(): Promise<void> {
    if (this.busy()) return;
    const t = this.tournament();
    const confirmed = await this.confirm({
      heading: `Delete ${t.configuration.title}?`,
      body: 'This draft was never published. It is deleted permanently, with its configuration. This cannot be undone.',
      confirmLabel: 'Delete draft',
      leaveLabel: 'Keep the draft',
      destructive: true,
    });
    if (!confirmed) return;
    this.busy.set('delete');
    this.failure.set(null);
    try {
      await firstValueFrom(this.api.deleteDraft(this.organisation(), t.id, { expectedRevision: t.revision }));
      this.toasts.show(`${t.configuration.title} deleted.`);
      this.deleted.emit();
    } catch (error) {
      if (this.access.problem()) return;
      // Not found: an earlier attempt deleted it and its answer was lost.
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.toasts.show(`${t.configuration.title} deleted.`);
        this.deleted.emit();
        return;
      }
      this.failure.set(error instanceof HttpErrorResponse && error.status === 409
        ? 'The draft changed elsewhere. Reload the latest version and try again.'
        : 'The draft was not deleted. Try again.');
    } finally {
      this.busy.set(null);
    }
  }

  private open(template: TemplateRef<DialogContext>, trigger: HTMLElement): void {
    const open = this.dialogs.open(template, { trigger, viewContainerRef: this.viewContainerRef });
    this.openDialog = open;
    void open.closed.then(() => {
      if (this.openDialog === open) this.openDialog = null;
    });
  }
}
