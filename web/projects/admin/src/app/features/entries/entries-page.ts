import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
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
import { Button, Icon, Notice, StatusLabel } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, injectWorkingOrganisation, QUERY_CLIENT } from '../../platform';
import { admittedText, dateTimeText, instantText, lifecycleLabels, locationText } from '../../shared';
import {
  cancellationEffect,
  fieldKey,
  firstInQueue,
  guestKind,
  guestsKey,
  hasFreeSlot,
  ruleText,
  tournamentKey,
  tournamentsKey,
  waitingReasonText,
} from './entries';

type Panel =
  | { readonly kind: 'add' }
  | { readonly kind: 'cancel' | 'admit'; readonly entry: EntryDetails; readonly trigger: HTMLElement | null }
  | null;

interface Failure {
  readonly heading: string;
  readonly text: string;
}

/** A published tournament's entries: added as guests, admitted and cancelled by the owner (EN-1 to EN-12). */
@Component({
  selector: 'app-entries-page',
  imports: [Button, Icon, Notice, RouterLink, StatusLabel],
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
  private readonly panelHeading = viewChild<ElementRef<HTMLElement>>('panelHeading');
  private readonly addButton = viewChild('addButton', { read: ElementRef<HTMLElement> });
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
  /** The last outcome, for everyone and for screen readers. */
  protected readonly announcement = signal('');

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
  protected readonly policy = computed(() => {
    const field = this.field.data()!;
    return `${field.terms.admission === 'manual' ? 'Manual' : 'Automatic'} admission · ${field.waiting} waiting`;
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
  protected readonly created = (guest: GuestDetails) => `Existing ${this.kind()} · created ${instantText(guest.createdAt, this.zone()).split(',')[0]}`;

  protected openAdd(): void {
    if (this.addBlocked()) return;
    this.mode.set('existing');
    this.resetAdd();
    this.show({ kind: 'add' });
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

  protected askCancel(entry: EntryDetails, trigger: HTMLElement): void {
    this.show({ kind: 'cancel', entry, trigger });
  }

  /** In queue order, or a pending entry, admits at once; skipping the capacity queue asks for the reason first (EN-7). */
  protected admit(entry: EntryDetails, trigger: HTMLElement): void {
    if (entry.waitingReason === 'capacityFull' && this.first()?.id !== entry.id) {
      this.reason.set('');
      this.reasonError.set(null);
      this.show({ kind: 'admit', entry, trigger });
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

  /** Closes a panel and gives focus back to what opened it. */
  protected close(): void {
    const panel = this.panel();
    this.panel.set(null);
    this.failure.set(null);
    const trigger = panel && panel.kind !== 'add' ? panel.trigger : this.addButton()?.nativeElement;
    setTimeout(() => trigger?.focus());
  }

  protected async reload(): Promise<void> {
    await Promise.all([this.field.refetch(), this.tournament.refetch()]);
    this.state.set('ready');
    this.failure.set(null);
    this.panel.set(null);
  }

  private show(panel: Panel): void {
    this.panel.set(panel);
    this.failure.set(null);
    this.announcement.set('');
    setTimeout(() => this.panelHeading()?.nativeElement.focus());
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
    this.announcement.set('');
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
    this.announcement.set(
      entered ? `${entered.guestName} added · ${entered.state === 'admitted' ? 'Admitted' : `Waiting: ${waitingReasonText(entered)}`}.` : done,
    );
    this.guestAttempt = null;
    this.entryAttempt = null;
    this.resetAdd();
    this.panel.set(null);
    // The row that opened the write may have moved or lost its action: focus goes to the counts, which changed.
    setTimeout(() => this.summaryHeading()?.nativeElement.focus());
  }

  private fail(heading: string, error: unknown): void {
    // Lost access shows its own state; nothing to add here.
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'entry-revision-conflict') {
      this.state.set('conflict');
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
