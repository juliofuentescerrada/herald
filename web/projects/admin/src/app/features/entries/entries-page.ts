import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EntryDetails,
  FieldDetails,
  GuestConflict,
  GuestDetails,
  HeraldHostAdminService,
  HttpValidationProblemDetails,
  problemOf,
  TournamentDetails,
} from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Drawer, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, injectWorkingOrganisation, QUERY_CLIENT } from '../../platform';
import { admittedText, dateTimeText, instantText, lifecycleLabels, locationText } from '../../shared';
import { RosterDrawer } from './roster-drawer';
import {
  cancellationEffect,
  fieldKey,
  firstInQueue,
  guestKind,
  guestsKey,
  hasFreeSlot,
  rosterText,
  ruleText,
  tournamentKey,
  tournamentsKey,
  waitingReasonText,
} from './entries';

type Panel = { readonly kind: 'add' } | { readonly kind: 'cancel' | 'admit' | 'roster'; readonly entry: EntryDetails } | null;

interface Failure {
  readonly heading: string;
  readonly text: string;
}

/** A check-in write's failure, said under its row (design D-5). */
interface RowFailure {
  readonly entryId: string;
  readonly text: string;
}

/** A published tournament's entries: added as guests, admitted and cancelled by the owner (EN-1 to EN-12). */
@Component({
  selector: 'app-entries-page',
  imports: [Button, Dialog, Drawer, Icon, Notice, RosterDrawer, RouterLink, StatusLabel],
  templateUrl: './entries-page.html',
  styleUrl: './entries-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntriesPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly tournamentId = inject(ActivatedRoute).snapshot.paramMap.get('tournamentId')!;
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly addDrawer = viewChild.required<TemplateRef<DialogContext>>('addDrawer');
  private readonly cancelDialog = viewChild.required<TemplateRef<DialogContext>>('cancelDialog');
  private readonly admitDialog = viewChild.required<TemplateRef<DialogContext>>('admitDialog');
  private readonly rosterDrawer = viewChild.required<TemplateRef<DialogContext>>('rosterDrawer');
  /** The open dialog or drawer, which shows `panel`. */
  private open: DialogRef | null = null;
  private readonly summaryHeading = viewChild<ElementRef<HTMLElement>>('summaryHeading');

  protected readonly workingOrganisation = injectWorkingOrganisation();
  protected readonly tournament = injectQuery(() => ({
    queryKey: tournamentKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getTournament<TournamentDetails>(this.organisation, this.tournamentId)),
    retry: false,
  }));
  /** A draft has no field: it is not asked for. */
  protected readonly field = injectQuery(() => ({
    queryKey: fieldKey(this.organisation, this.tournamentId),
    queryFn: () => firstValueFrom(this.api.getField<FieldDetails>(this.organisation, this.tournamentId)),
    enabled: this.tournament.data()?.publication === 'published',
    retry: false,
  }));

  protected readonly panel = signal<Panel>(null);
  protected readonly state = signal<'ready' | 'busy' | 'conflict'>('ready');
  protected readonly failure = signal<Failure | null>(null);
  /** Check-in writes are per row: other rows and adding stay usable meanwhile (design D-5). */
  protected readonly checkingIn = signal<ReadonlySet<string>>(new Set());
  protected readonly rowFailure = signal<RowFailure | null>(null);

  // The add panel: choosing an existing guest or creating one, and the possible duplicates of a creation.
  protected readonly mode = signal<'existing' | 'new'>('existing');
  protected readonly name = signal('');
  protected readonly nameError = signal<string | null>(null);
  protected readonly matches = signal<GuestDetails[] | null>(null);
  protected readonly reason = signal('');
  protected readonly reasonError = signal<string | null>(null);
  /** Identifiers chosen by the client and reused when the same write is sent again after a lost answer. */
  private guestAttempt: { readonly id: string; readonly content: string } | null = null;
  private entryAttempt: { readonly id: string; readonly guestId: string } | null = null;

  protected readonly guests = injectQuery(() => {
    const field = this.field.data();
    const search = this.name().trim();
    return {
      queryKey: [...guestsKey(this.organisation), field ? guestKind(field) : null, search],
      queryFn: () => firstValueFrom(this.api.findGuests<GuestDetails[]>(this.organisation, { kind: guestKind(field!), name: search })),
      enabled: !!field && this.panel()?.kind === 'add' && this.mode() === 'existing' && search !== '',
      retry: false,
    };
  });

  protected readonly unavailable = computed(() => this.tournament.isError() || (this.tournament.data() && this.tournament.data()!.publication !== 'published'));
  protected readonly zone = computed(() => this.tournament.data()?.configuration.timeZone ?? 'UTC');
  protected readonly labels = computed(() => (this.tournament.data() ? lifecycleLabels(this.tournament.data()!) : []));
  protected readonly facts = computed(() => {
    const c = this.tournament.data()?.configuration;
    if (!c) return '';
    return [c.gameVariant, c.entryKind === 'team' ? 'Team' : 'Individual', locationText(c)].filter(Boolean).join(' · ');
  });
  protected readonly starts = computed(() => {
    const c = this.tournament.data()?.configuration;
    return c?.plannedStartAt ? `${dateTimeText(c.plannedStartAt)} · ${c.timeZone}` : '';
  });

  protected readonly kind = computed(() => (this.field.data() ? guestKind(this.field.data()!) : 'player'));
  protected readonly addLabel = computed(() => (this.kind() === 'team' ? 'Add team' : 'Add player'));
  protected readonly admitted = computed(() => this.field.data()?.entries.filter((entry) => entry.state === 'admitted') ?? []);
  protected readonly waiting = computed(() => this.field.data()?.entries.filter((entry) => entry.state === 'waiting') ?? []);
  protected readonly cancelled = computed(() => this.field.data()?.entries.filter((entry) => entry.state === 'cancelled') ?? []);
  protected readonly activeGuests = computed(() => new Set([...this.admitted(), ...this.waiting()].map((entry) => entry.guestId)));
  protected readonly summary = computed(() => {
    const field = this.field.data()!;
    return admittedText(field.admitted, { capacity: field.terms.capacity, entryKind: field.terms.entryKind });
  });
  /** What waits for the owner: decisions under manual admission, slots under automatic (design D-6). */
  protected readonly policy = computed(() => {
    const manual = this.field.data()!.terms.admission === 'manual';
    const reason = manual ? 'admissionPending' : 'capacityFull';
    const count = this.waiting().filter((entry) => entry.waitingReason === reason).length;
    return manual ? `Manual admission · ${count} pending your decision` : `Automatic admission · ${count} waiting for a slot`;
  });
  /** The policy always; the count once an entry is admitted (A-4). */
  protected readonly checkInSummary = computed(() => {
    const policy = this.tournament.data()?.configuration.checkIn === 'mandatory' ? 'Check-in mandatory' : 'Check-in optional';
    const admitted = this.admitted().length;
    return admitted ? `${policy} · ${this.field.data()!.checkedIn} of ${admitted} checked in` : policy;
  });
  protected readonly termsUpdated = computed(() => `Entry terms updated ${instantText(this.field.data()!.termsReceivedAt, this.zone())} · ${this.zone()}`);

  /** Why adding is unavailable, or null when it is (EN-2, EN-12). */
  protected readonly addBlocked = computed(() => {
    const field = this.field.data();
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest version first.';
    if (!field) return null;
    if (field.overCapacityBy > 0) return 'Field is over capacity. Cancel an admitted entry before adding or admitting.';
    if (field.kindMismatch) return 'The field has entries of the other kind. Resolve that before adding or admitting.';
    if (field.terms.registration === 'closed') return 'Registration is closed. Reopen registration in configuration to add entries.';
    return field.terms.registration === 'open' ? null : 'Registration is not open. Open registration in configuration to add entries.';
  });

  /** Why a waiting entry cannot be admitted, said under its row; null when it can. */
  protected readonly admitBlocked = computed(() => {
    const field = this.field.data();
    if (!field || hasFreeSlot(field)) return null;
    if (field.overCapacityBy > 0) return 'Field is over capacity. Cancel an admitted entry first.';
    if (field.kindMismatch) return 'The field has entries of the other kind. Resolve that first.';
    return 'No free slot. Cancel an admitted entry or increase capacity.';
  });

  protected readonly first = computed(() => (this.field.data() ? firstInQueue(this.field.data()!) : undefined));
  protected readonly effect = computed(() => {
    const panel = this.panel();
    return panel?.kind === 'cancel' ? cancellationEffect(this.field.data()!, panel.entry) : '';
  });

  protected readonly zoned = (instant: string | null | undefined) => (instant ? `${instantText(instant, this.zone())} · ${this.zone()}` : '');
  protected readonly waitingReason = waitingReasonText;
  protected readonly tournamentIdentifier = this.tournamentId;
  /** A team tournament's rows show their roster's readiness and open it; an individual one has no rosters. */
  protected readonly teams = computed(() => this.field.data()?.terms.entryKind === 'team');
  protected readonly readiness = (entry: EntryDetails) => rosterText(entry.rosterSize ?? 0, this.field.data()!.terms, entry.rosterReadiness ?? 'awaitingTerms');
  protected readonly created = (guest: GuestDetails) => `Existing ${this.kind()} · created ${instantText(guest.createdAt, this.zone()).split(',')[0]}`;

  protected openAdd(trigger: HTMLElement): void {
    if (this.addBlocked()) return;
    this.mode.set('existing');
    this.resetAdd();
    this.show({ kind: 'add' }, trigger);
  }

  protected choose(mode: 'existing' | 'new'): void {
    this.mode.set(mode);
    this.matches.set(null);
    this.nameError.set(null);
    this.failure.set(null);
  }

  protected typed(value: string): void {
    this.name.set(value);
    this.matches.set(null);
    this.nameError.set(null);
  }

  /** Writes at once, no dialog: the action is reversible (design D-5). */
  protected async toggleCheckIn(entry: EntryDetails): Promise<void> {
    if (this.state() === 'conflict' || this.checkingIn().has(entry.id)) return;
    const confirm = entry.checkIn !== 'confirmed';
    const revision = entry.checkInRevision ?? 0;
    this.checkingIn.update((ids) => new Set([...ids, entry.id]));
    if (this.rowFailure()?.entryId === entry.id) this.rowFailure.set(null);
    try {
      const field = await firstValueFrom(
        confirm
          ? this.api.checkIn<FieldDetails>(this.organisation, this.tournamentId, entry.id, { expectedRevision: revision })
          : this.api.undoCheckIn<FieldDetails>(this.organisation, this.tournamentId, entry.id, { expectedRevision: revision }),
      );
      // Answers to concurrent rows may arrive out of order: only a newer field replaces the one shown.
      if (field.revision >= (this.field.data()?.revision ?? 0)) this.queries.setQueryData(fieldKey(this.organisation, this.tournamentId), field);
      void this.queries.invalidateQueries({ queryKey: tournamentKey(this.organisation, this.tournamentId) });
      this.toasts.show(confirm ? `${entry.guestName} checked in.` : `${entry.guestName}’s check-in undone.`);
    } catch (error) {
      this.failCheckIn(entry, confirm, error);
    } finally {
      this.checkingIn.update((ids) => new Set([...ids].filter((id) => id !== entry.id)));
    }
  }

  protected openRoster(entry: EntryDetails, trigger: HTMLElement): void {
    this.show({ kind: 'roster', entry }, trigger);
  }

  protected askCancel(entry: EntryDetails, trigger: HTMLElement): void {
    this.show({ kind: 'cancel', entry }, trigger);
  }

  /** In queue order, or a pending entry, admits at once; skipping the capacity queue asks for the reason first (EN-7). */
  protected admit(entry: EntryDetails, trigger: HTMLElement): void {
    if (entry.waitingReason === 'capacityFull' && this.first()?.id !== entry.id) {
      this.reason.set('');
      this.reasonError.set(null);
      this.show({ kind: 'admit', entry }, trigger);
      return;
    }
    void this.run('Entry was not admitted', () => this.send('admit', entry), `${entry.guestName} admitted.`);
  }

  protected confirmAdmit(): void {
    const panel = this.panel();
    if (panel?.kind !== 'admit' || !this.reason().trim()) return;
    void this.run('Entry was not admitted', () => this.send('admit', panel.entry, this.reason().trim()), `${panel.entry.guestName} admitted.`);
  }

  protected confirmCancel(): void {
    const panel = this.panel();
    if (panel?.kind !== 'cancel') return;
    void this.run('Entry was not cancelled', () => this.send('cancel', panel.entry), `${panel.entry.guestName}’s entry cancelled.`);
  }

  protected enterExisting(guest: GuestDetails): void {
    void this.run('Entry was not added', () => this.enter(guest), '');
  }

  /** Creates the guest, then enters it; a possible duplicate stops before creating anything (EN-11). */
  protected createAndEnter(confirmNew = false): void {
    const name = this.name().trim();
    const kind = this.kind();
    void this.run('Entry was not added', async () => {
      const content = `${kind}:${name}`;
      if (this.guestAttempt?.content !== content) this.guestAttempt = { id: crypto.randomUUID(), content };
      let guest: GuestDetails;
      try {
        guest = await firstValueFrom(this.api.createGuest<GuestDetails>(this.organisation, this.guestAttempt.id, { kind, name, confirmNew }));
      } catch (error) {
        const conflict = problemOf<GuestConflict>(error);
        if (conflict?.type === 'possible-duplicate') {
          this.matches.set(conflict.matches);
          return null;
        }
        // The identifier is taken by something else: the next attempt gets a new one.
        if (conflict?.type === 'guest-identifier-reused') this.guestAttempt = null;
        throw error;
      }
      return this.enter(guest);
    }, '');
  }

  /** Closes the dialog or drawer without a change; focus goes back to what opened it. */
  protected close(): void {
    this.open?.close();
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.field.refetch(), this.tournament.refetch()]);
    this.state.set('ready');
    this.failure.set(null);
    this.rowFailure.set(null);
    this.close();
  }

  private show(panel: Exclude<Panel, null>, trigger: HTMLElement): void {
    this.panel.set(panel);
    this.failure.set(null);
    const open = this.dialogs.open({ add: this.addDrawer, cancel: this.cancelDialog, admit: this.admitDialog, roster: this.rosterDrawer }[panel.kind](), { trigger, viewContainerRef: this.viewContainerRef });
    this.open = open;
    // Escape, the leaving action and a completed write all end here.
    void open.closed.then(() => {
      if (this.open !== open) return;
      this.open = null;
      this.panel.set(null);
      this.failure.set(null);
    });
  }

  private resetAdd(): void {
    this.name.set('');
    this.nameError.set(null);
    this.matches.set(null);
  }

  private enter(guest: GuestDetails): Promise<FieldDetails> {
    if (this.entryAttempt?.guestId !== guest.id) this.entryAttempt = { id: crypto.randomUUID(), guestId: guest.id };
    return firstValueFrom(this.api.enterGuest<FieldDetails>(this.organisation, this.tournamentId, this.entryAttempt.id, { guestId: guest.id }));
  }

  private send(action: 'admit' | 'cancel', entry: EntryDetails, reason?: string): Promise<FieldDetails> {
    const body = { expectedRevision: entry.revision };
    return firstValueFrom(
      action === 'admit'
        ? this.api.admitEntry<FieldDetails>(this.organisation, this.tournamentId, entry.id, { ...body, reason: reason ?? null })
        : this.api.cancelEntry<FieldDetails>(this.organisation, this.tournamentId, entry.id, body),
    );
  }

  /** One write at a time (a write in progress is not repeatable); its answer is the field as it now is. */
  private async run(heading: string, write: () => Promise<FieldDetails | null>, done: string): Promise<void> {
    if (this.state() !== 'ready') return;
    this.state.set('busy');
    this.failure.set(null);
    try {
      const field = await write();
      this.state.set('ready');
      if (field) this.accept(field, done);
    } catch (error) {
      this.state.set('ready');
      this.fail(heading, error);
    }
  }

  private accept(field: FieldDetails, done: string): void {
    this.queries.setQueryData(fieldKey(this.organisation, this.tournamentId), field);
    // Tournaments learns the counts through its own projection; both reads are asked again.
    void this.queries.invalidateQueries({ queryKey: tournamentKey(this.organisation, this.tournamentId) });
    void this.queries.invalidateQueries({ queryKey: tournamentsKey(this.organisation) });
    void this.queries.invalidateQueries({ queryKey: guestsKey(this.organisation) });
    const entered = this.entryAttempt && field.entries.find((entry) => entry.id === this.entryAttempt!.id);
    const outcome = entered ? `${entered.guestName} added · ${entered.state === 'admitted' ? 'Admitted' : `Waiting: ${waitingReasonText(entered)}`}.` : done;
    if (outcome) this.toasts.show(outcome);
    this.guestAttempt = null;
    this.entryAttempt = null;
    this.resetAdd();
    // The row that opened the write may have moved or lost its action: focus goes to the counts, which changed.
    const open = this.open;
    if (open) {
      this.close();
      void open.closed.then(() => this.summaryHeading()?.nativeElement.focus());
    } else {
      setTimeout(() => this.summaryHeading()?.nativeElement.focus());
    }
  }

  private failCheckIn(entry: EntryDetails, confirm: boolean, error: unknown): void {
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'check-in-revision-conflict') {
      this.state.set('conflict');
      return;
    }
    const [field, rules] = Object.entries((status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null) ?? {})[0] ?? [];
    const heading = confirm ? 'Check-in was not recorded.' : 'Undo was not recorded.';
    if (field) {
      // The entry changed since it was read: what the owner sees is brought up to date.
      this.rowFailure.set({ entryId: entry.id, text: `${heading} ${ruleText(field, rules[0])} Nothing changed.` });
      void this.field.refetch();
    } else {
      this.rowFailure.set({ entryId: entry.id, text: `${heading} The request failed. Nothing changed; try “${confirm ? 'Check in' : 'Undo check-in'}” again.` });
    }
  }

  private fail(heading: string, error: unknown): void {
    // Lost access shows its own state; nothing to add here.
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'entry-revision-conflict') {
      // A conflict is explained on the page, which the dialog would cover.
      this.state.set('conflict');
      this.close();
      return;
    }

    const rejected = status === 400 ? problemOf<HttpValidationProblemDetails>(error)?.errors : null;
    const [field, rules] = Object.entries(rejected ?? {})[0] ?? [];
    if (field === 'name') {
      this.nameError.set(ruleText(field, rules[0]));
    } else if (field === 'reason') {
      this.reasonError.set(ruleText(field, rules[0]));
    } else if (field) {
      // The field changed since it was read: what the owner sees is brought up to date.
      this.failure.set({ heading, text: `${ruleText(field, rules[0])} Nothing changed.` });
      void this.field.refetch();
    } else {
      this.failure.set({
        heading,
        text: this.panel()?.kind === 'add' ? 'The request failed. Nothing was added. Your input is kept; try again.' : 'The request failed. Nothing changed. Try again.',
      });
    }
  }
}
