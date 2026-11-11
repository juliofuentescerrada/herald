import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import {
  GuestConflict,
  GuestDetails,
  HeraldHostAdminService,
  HttpValidationProblemDetails,
  problemOf,
  RosterDetails,
  RosterMemberDetails,
  RosterTeam,
} from '@herald/api-client/admin';
import { Button, Drawer, Icon, Notice } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, injectMe, QUERY_CLIENT } from '../../platform';
import { instantText } from '../../shared';
import { fieldKey, guestsKey, rosterKey, rosterText, ruleText } from './entries';

interface Failure {
  readonly heading: string;
  readonly text: string;
}

/**
 * A team entry's tournament roster: its members, adding a guest player (existing or new) and removing
 * one, and its history (h1-team-rosters). A completed write shows in the list and the row, with no toast.
 */
@Component({
  selector: 'app-roster-drawer',
  imports: [Button, Drawer, Icon, Notice],
  templateUrl: './roster-drawer.html',
  styleUrl: './entries-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RosterDrawer {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly organisation = inject(AppContext).organisation()!;
  private readonly me = injectMe();
  private readonly membersHeading = viewChild<ElementRef<HTMLElement>>('membersHeading');

  readonly tournamentId = input.required<string>();
  readonly entryId = input.required<string>();
  /** The team's name from the page, shown while the roster loads. */
  readonly teamName = input.required<string>();
  readonly tournamentTitle = input.required<string>();
  readonly zone = input.required<string>();
  readonly organisationName = input.required<string>();
  readonly leave = output();

  protected readonly roster = injectQuery(() => ({
    queryKey: rosterKey(this.organisation, this.tournamentId(), this.entryId()),
    queryFn: () => firstValueFrom(this.api.getRoster<RosterDetails>(this.organisation, this.tournamentId(), this.entryId())),
    retry: false,
  }));

  protected readonly step = signal<'roster' | 'add'>('roster');
  protected readonly state = signal<'ready' | 'busy' | 'conflict'>('ready');
  protected readonly failure = signal<Failure | null>(null);
  /** The member whose removal is in progress. */
  protected readonly removing = signal<string | null>(null);

  // Adding: choosing an existing guest player or creating one, and the possible duplicates of a creation.
  protected readonly mode = signal<'existing' | 'new'>('existing');
  protected readonly name = signal('');
  protected readonly nameError = signal<string | null>(null);
  protected readonly matches = signal<GuestDetails[] | null>(null);
  /** Chosen by the client and reused when the same creation is sent again after a lost answer. */
  private guestAttempt: { readonly id: string; readonly name: string } | null = null;

  protected readonly guests = injectQuery(() => {
    const search = this.name().trim();
    return {
      queryKey: [...guestsKey(this.organisation), 'player', search, this.tournamentId()],
      queryFn: () => firstValueFrom(this.api.findGuests<GuestDetails[]>(this.organisation, { kind: 'player', name: search, tournamentId: this.tournamentId() })),
      enabled: this.step() === 'add' && this.mode() === 'existing' && search !== '',
      retry: false,
    };
  });

  protected readonly heading = computed(() => `Roster · ${this.roster.data()?.teamName ?? this.teamName()}`);
  protected readonly readOnly = computed(() => this.roster.data()?.entryState === 'cancelled');
  protected readonly context = computed(() => {
    const state = this.roster.data()?.entryState;
    const team = state === 'cancelled' ? 'Cancelled team' : state === 'waiting' ? 'Waiting team' : 'Admitted team';
    return `${team} · ${this.tournamentTitle()}`;
  });
  protected readonly bounds = computed(() => {
    const roster = this.roster.data()!;
    return roster.minimumRosterSize == null || roster.maximumRosterSize == null
      ? 'Waiting for the tournament’s roster sizes'
      : `${roster.minimumRosterSize} to ${roster.maximumRosterSize} players`;
  });
  protected readonly readiness = computed(() => {
    const roster = this.roster.data()!;
    return rosterText(roster.members.length, roster, roster.readiness);
  });
  protected readonly members = computed(() => this.roster.data()?.members.map((member) => member.guestId) ?? []);

  /** Why adding is unavailable, or null when it is. */
  protected readonly addBlocked = computed(() => {
    const roster = this.roster.data();
    if (this.state() === 'busy') return 'Request in progress. Please wait; do not submit again.';
    if (this.state() === 'conflict') return 'Reload the latest roster first.';
    if (!roster) return null;
    const size = roster.members.length;
    if (roster.maximumRosterSize == null) return 'The tournament’s roster sizes are not known yet. Saving the tournament’s configuration sends them.';
    if (size > roster.maximumRosterSize) {
      const remove = size - roster.maximumRosterSize + 1;
      return `The roster has ${size} players, above the maximum of ${roster.maximumRosterSize}. Remove ${remove} members before adding another player.`;
    }
    return size === roster.maximumRosterSize ? `The roster has ${size} players, the maximum. Remove a member before adding another player.` : null;
  });
  protected readonly removeBlocked = computed(() => this.state() !== 'ready' || this.roster.data()?.maximumRosterSize == null);

  protected readonly added = (member: RosterMemberDetails) => `Added ${instantText(member.addedAt, this.zone())}`;
  protected readonly zoned = (instant: string) => `${instantText(instant, this.zone())} · ${this.zone()}`;
  protected readonly created = (guest: GuestDetails) => `Existing player · created ${instantText(guest.createdAt, this.zone()).split(',')[0]}`;
  // shortcut: H1 has one owner per organisation, so every roster change is the signed-in person's; name actors from the API when organisations get more members.
  protected readonly actor = () => this.me.data()?.displayName ?? 'The owner';
  /** A player on this roster, or on another active team's, has no add action. */
  protected readonly onTeam = (guest: GuestDetails): RosterTeam | null => (guest.team && guest.team.entryId !== this.entryId() ? guest.team : null);

  protected openAdd(): void {
    if (this.addBlocked()) return;
    this.step.set('add');
    this.choose('existing');
    this.name.set('');
  }

  protected backToRoster(): void {
    this.step.set('roster');
    this.failure.set(null);
    this.matches.set(null);
    this.nameError.set(null);
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

  protected addExisting(guest: GuestDetails): void {
    void this.run('Player was not added', () => this.add(guest.id));
  }

  /** Creates the guest player, then adds them; a possible duplicate stops before creating anything (EN-11). */
  protected createAndAdd(confirmNew = false): void {
    const name = this.name().trim();
    void this.run('Player was not added', async () => {
      if (this.guestAttempt?.name !== name) this.guestAttempt = { id: crypto.randomUUID(), name };
      let guest: GuestDetails;
      try {
        guest = await firstValueFrom(this.api.createGuest<GuestDetails>(this.organisation, this.guestAttempt.id, { kind: 'player', name, confirmNew }));
      } catch (error) {
        const conflict = problemOf<GuestConflict>(error);
        if (conflict?.type === 'possible-duplicate') {
          this.matches.set(conflict.matches);
          return null;
        }
        if (conflict?.type === 'guest-identifier-reused') this.guestAttempt = null;
        throw error;
      }
      return this.add(guest.id);
    });
  }

  /** Removing needs no reason or confirmation (R-10); it is recorded in the history. */
  protected remove(member: RosterMemberDetails): void {
    if (this.removeBlocked()) return;
    this.removing.set(member.guestId);
    void this.run('Player was not removed', () =>
      firstValueFrom(
        this.api.removeRosterMember<RosterDetails>(this.organisation, this.tournamentId(), this.entryId(), member.guestId, {
          expectedRevision: this.roster.data()!.revision,
        }),
      ),
    );
  }

  protected async reload(): Promise<void> {
    await this.roster.refetch();
    void this.queries.invalidateQueries({ queryKey: fieldKey(this.organisation, this.tournamentId()) });
    this.state.set('ready');
    this.failure.set(null);
  }

  private add(guestId: string): Promise<RosterDetails> {
    return firstValueFrom(
      this.api.addRosterMember<RosterDetails>(this.organisation, this.tournamentId(), this.entryId(), guestId, { expectedRevision: this.roster.data()!.revision }),
    );
  }

  /** One write at a time; its answer is the roster as it now is. */
  private async run(heading: string, write: () => Promise<RosterDetails | null>): Promise<void> {
    if (this.state() !== 'ready') return;
    this.state.set('busy');
    this.failure.set(null);
    try {
      const roster = await write();
      this.state.set('ready');
      if (roster) this.accept(roster);
    } catch (error) {
      this.state.set('ready');
      this.fail(heading, error);
    } finally {
      this.removing.set(null);
    }
  }

  private accept(roster: RosterDetails): void {
    this.queries.setQueryData(rosterKey(this.organisation, this.tournamentId(), this.entryId()), roster);
    // The row's readiness and the search's "On team" both change with the roster.
    void this.queries.invalidateQueries({ queryKey: fieldKey(this.organisation, this.tournamentId()) });
    void this.queries.invalidateQueries({ queryKey: guestsKey(this.organisation) });
    this.guestAttempt = null;
    this.name.set('');
    this.backToRoster();
    setTimeout(() => this.membersHeading()?.nativeElement.focus());
  }

  private fail(heading: string, error: unknown): void {
    if (this.access.problem()) return;
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 409 && problemOf<{ type?: string }>(error)?.type === 'roster-revision-conflict') {
      // The last list stays visible until the owner reloads it.
      this.state.set('conflict');
      this.backToRoster();
      return;
    }

    const problem = status === 400 ? problemOf<HttpValidationProblemDetails & { team?: RosterTeam }>(error) : null;
    const [field, rules] = Object.entries(problem?.errors ?? {})[0] ?? [];
    if (field === 'name') {
      this.nameError.set(ruleText(field, rules[0]));
    } else if (field) {
      const text = rules[0] === 'on-another-team' && problem?.team ? `This player is on ${problem.team.name}’s roster in this tournament.` : ruleText(field, rules[0]);
      this.failure.set({ heading, text: `${text} Nothing changed.` });
      void this.roster.refetch();
      void this.queries.invalidateQueries({ queryKey: guestsKey(this.organisation) });
    } else {
      this.failure.set({
        heading,
        text: this.step() === 'add' ? 'The request failed. Nothing was added. Your input is kept; try again.' : 'The request failed. Nothing changed. Try again.',
      });
    }
  }
}
