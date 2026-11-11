import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DOCUMENT, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeraldHostAdminService, HttpValidationProblemDetails, problemOf, TournamentConfiguration, TournamentDetails } from '@herald/api-client/admin';
import { Button, Icon, Notice, StatusLabel } from '@herald/ui';
import { firstValueFrom } from 'rxjs';
import { AccessState, CONFIRM, injectWorkingOrganisation, QUERY_CLIENT } from '../../platform';
import {
  dateTimeText,
  fieldLabels,
  injectOrganisation,
  injectTournament,
  lifecycleLabels,
  locationText,
  profileText,
  tournamentKey,
  tournamentsKey,
  tournamentsPath,
} from './tournaments';
import { RegistrationArea } from './registration-area';

const names = [
  'title', 'gameVariant', 'entryKind', 'capacity', 'minimumRosterSize', 'maximumRosterSize', 'activePlayersPerSide',
  'registrationOpensAt', 'registrationClosesAt', 'plannedStartAt', 'timeZone', 'location', 'venue', 'admission', 'checkIn', 'visibility',
] as const;
type Name = (typeof names)[number];
/** What the controls hold: text, so nothing typed is lost while it is not yet a valid value. */
type Draft = Record<Name, string>;

interface Field {
  readonly name: Name | 'profile';
  readonly kind: 'text' | 'number' | 'datetime' | 'select' | 'readonly';
  readonly label: string;
  readonly help: string;
  readonly options?: readonly (readonly [string, string])[];
  readonly wide?: boolean;
}

const empty = Object.fromEntries(names.map((name) => [name, ''])) as Draft;
const text = (value: string) => value.trim() || null;
const whole = (value: string) => (value.trim() === '' ? null : Number.parseInt(value, 10));
const local = (value: string) => (value ? `${value.slice(0, 16)}:00` : null);

const fromConfiguration = (c: TournamentConfiguration): Draft => ({
  ...empty,
  ...Object.fromEntries(names.map((name) => [name, c[name] == null ? '' : String(c[name])])),
  registrationOpensAt: c.registrationOpensAt?.slice(0, 16) ?? '',
  registrationClosesAt: c.registrationClosesAt?.slice(0, 16) ?? '',
  plannedStartAt: c.plannedStartAt?.slice(0, 16) ?? '',
});

/** Hidden controls are not sent: an individual tournament has no team structure, an online one no venue. */
const toConfiguration = (d: Draft): TournamentConfiguration => {
  const team = d.entryKind === 'team';
  return {
    title: d.title.trim(),
    gameVariant: text(d.gameVariant),
    entryKind: (d.entryKind || null) as TournamentConfiguration['entryKind'],
    capacity: whole(d.capacity),
    minimumRosterSize: team ? whole(d.minimumRosterSize) : null,
    maximumRosterSize: team ? whole(d.maximumRosterSize) : null,
    activePlayersPerSide: team ? whole(d.activePlayersPerSide) : null,
    registrationOpensAt: local(d.registrationOpensAt),
    registrationClosesAt: local(d.registrationClosesAt),
    plannedStartAt: local(d.plannedStartAt),
    timeZone: d.timeZone || null,
    location: (d.location || null) as TournamentConfiguration['location'],
    venue: d.location === 'online' ? null : text(d.venue),
    admission: (d.admission || null) as TournamentConfiguration['admission'],
    checkIn: (d.checkIn || null) as TournamentConfiguration['checkIn'],
    visibility: (d.visibility || null) as TournamentConfiguration['visibility'],
  };
};

/** The API's rule codes in words; the API applies the rules, the form only reports them. */
const ruleText = (field: string, rule: string): string => {
  const roster = field !== 'capacity';
  switch (rule) {
    case 'required':
      if (field === 'title') return 'Enter a title.';
      // Publication never requires these: only an open registration does.
      return field.startsWith('registration') ? 'Required while registration is open.' : 'This value is required.';
    case 'too-long': return 'Use fewer characters.';
    case 'out-of-range': return roster ? 'Use a number between 1 and 50.' : 'Capacity must be between 2 and 256.';
    case 'not-applicable': return 'This value does not apply to this tournament.';
    case 'below-active-players': return 'The roster must allow at least the active players per side.';
    case 'below-minimum': return 'The maximum roster size must be at least the minimum.';
    case 'not-after-opening': return 'Registration must close after it opens.';
    case 'after-planned-start': return 'Registration must close no later than the planned start.';
    case 'unknown': return 'Choose a time zone from the list.';
    case 'skipped-hour': return 'This time does not exist in the reference time zone: the clocks go forward.';
    default: return 'Check this value.';
  }
};

const zones = (): string[] => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [];
  }
};

/** Creates a draft, edits it, and edits a published tournament: one form, three moments. */
@Component({
  selector: 'app-tournament-form-page',
  imports: [Button, Icon, Notice, RegistrationArea, RouterLink, StatusLabel],
  templateUrl: './tournament-form-page.html',
  styleUrl: './tournament-form-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentFormPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(AccessState);
  private readonly confirm = inject(CONFIRM);
  private readonly document = inject(DOCUMENT);
  protected readonly organisation = injectOrganisation();
  private readonly summary = viewChild<ElementRef<HTMLElement>>('summary');

  protected readonly listPath = tournamentsPath(this.organisation);
  protected readonly isNew = this.route.snapshot.paramMap.get('tournamentId') === null;
  protected readonly tournament = injectTournament(this.organisation);
  /** The tournament as the API last answered; absent until a new one is first saved. */
  protected readonly stored = signal<TournamentDetails | null>(null);
  protected readonly draft = signal<Draft>(this.initial());
  private readonly baseline = signal(JSON.stringify(this.draft()));
  protected readonly state = signal<'editing' | 'saving' | 'saved' | 'failed' | 'conflict'>(
    this.router.currentNavigation()?.extras.state?.['saved'] ? 'saved' : 'editing',
  );
  protected readonly errors = signal<Record<string, string[]>>({});
  /** One identifier per content of a creation, reused when the same content is sent again after a lost answer. */
  private attempt: { readonly id: string; readonly content: string } | null = null;

  private readonly workingOrganisation = injectWorkingOrganisation();
  protected readonly organisationName = computed(() => (this.workingOrganisation.data() ? `${this.workingOrganisation.data()!.name} · ` : ''));
  protected readonly published = computed(() => this.stored()?.publication === 'published');
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== this.baseline());
  protected readonly labels = computed(() => lifecycleLabels(this.stored() ?? { publication: 'draft', registration: 'notOpen', competition: 'preparation' }));
  protected readonly errorList = computed(() =>
    Object.entries(this.errors()).map(([field, rules]) => ({ field, text: `${fieldLabels[field] ?? field}: ${ruleText(field, rules[0])}` })),
  );
  protected readonly missing = computed(() => (this.published() ? [] : (this.stored()?.missingForPublication ?? [])));
  /** Why the review cannot open, or null when it can. */
  protected readonly reviewBlocked = computed(() => {
    if (!this.stored()) return 'Save the draft first: the review shows what is saved.';
    if (this.dirty()) return 'Save your changes first: the review shows what is saved.';
    return this.missing().length ? 'Complete the values missing for publication first.' : null;
  });
  protected readonly facts = computed(() => {
    const c = this.stored()?.configuration;
    if (!c) return '';
    const kind = c.entryKind === 'team' ? 'Team' : 'Individual';
    return [c.gameVariant, kind, locationText(c)].filter(Boolean).join(' · ');
  });
  protected readonly starts = computed(() => {
    const c = this.stored()?.configuration;
    return c?.plannedStartAt ? `${dateTimeText(c.plannedStartAt)} · ${c.timeZone}` : '';
  });

  protected readonly sections = computed(() => {
    const d = this.draft();
    const team = d.entryKind === 'team';
    const zoneOptions = [...new Set([...zones(), ...(d.timeZone ? [d.timeZone] : [])])].sort().map((zone) => [zone, zone] as const);
    const field = (name: Name, kind: Field['kind'], help: string, extra: Partial<Field> = {}): Field => ({ name, kind, label: fieldLabels[name], help, ...extra });
    return [
      {
        heading: 'Tournament details',
        help: this.published() ? 'A published tournament must stay complete.' : 'A draft can be saved before all publication requirements are complete.',
        fields: [
          field('title', 'text', 'The tournament name shown when published.', { wide: true }),
          field('gameVariant', 'text', 'Free text, for example the game and its variant.', { wide: true }),
          field('entryKind', 'select', 'Each entry takes one place in the tournament.', { options: [['individual', 'Individual'], ['team', 'Team']] }),
          field('capacity', 'number', team ? '16 teams means 16 places, regardless of roster size.' : 'How many entries the tournament admits.', {
            label: team ? 'Capacity in teams' : d.entryKind === 'individual' ? 'Capacity in individual entries' : 'Capacity in entries',
          }),
        ],
      },
      ...(team
        ? [{
            heading: 'Team structure',
            help: 'Roster size and players taking part on each side are separate limits.',
            fields: [
              field('minimumRosterSize', 'number', 'Players required on each team’s roster.'),
              field('maximumRosterSize', 'number', 'Players allowed on each team’s roster.'),
              field('activePlayersPerSide', 'number', 'Players taking part on one side of a match.'),
            ],
          }]
        : []),
      {
        heading: 'Competition profile',
        help: 'This H1 profile is fixed; points are not edited per tournament.',
        fields: [{ name: 'profile', kind: 'readonly', label: 'Competition profile', help: 'Win 3 · Draw 1 · Loss 0. Equal points share a position. Draws are allowed.', wide: true } as Field],
      },
      {
        heading: 'Dates and location',
        help: 'All three times use the reference time zone. A planned date does not start competition.',
        fields: [
          field('registrationOpensAt', 'datetime', 'Planned opening; publication does not open registration.'),
          field('registrationClosesAt', 'datetime', 'Must not be later than the planned start.'),
          field('plannedStartAt', 'datetime', 'The announced start date and time.'),
          field('timeZone', 'select', 'Times above are interpreted in this zone.', { options: zoneOptions }),
          field('location', 'select', 'Choose a venue or an online tournament.', { options: [['onSite', 'On-site venue'], ['online', 'Online']] }),
          ...(d.location === 'online' ? [] : [field('venue', 'text', 'City or venue name for an on-site tournament.')]),
        ],
      },
      {
        heading: 'Admission and visibility',
        help: 'Nothing is preselected: each is your decision for this tournament.',
        fields: [
          field('admission', 'select', 'Automatic admission or an operator decision.', { options: [['automatic', 'Automatic'], ['manual', 'Manual']] }),
          field('checkIn', 'select', 'Whether admitted entrants must check in.', { options: [['optional', 'Optional'], ['mandatory', 'Mandatory']] }),
          field('visibility', 'select', 'Public: listed. Unlisted: readable by link. Private: owner-only access.', {
            options: [['public', 'Public'], ['unlisted', 'Unlisted'], ['private', 'Private']],
            wide: true,
          }),
        ],
      },
    ];
  });

  protected readonly profile = profileText;
  protected readonly dateTime = dateTimeText;
  protected readonly label = (name: string) => fieldLabels[name] ?? name;

  constructor() {
    // What this person typed and has not saved: kept for copying if access stops, and asked about on leaving.
    this.access.keepDraft(() =>
      this.dirty()
        ? names.filter((name) => this.draft()[name].trim()).map((name) => `${fieldLabels[name]}: ${this.draft()[name].trim()}`).join('\n')
        : '',
    );
    effect(() => {
      const loaded = this.tournament.data();
      if (loaded && !untracked(this.stored)) untracked(() => this.accept(loaded));
    });
  }

  protected value(name: Field['name']): string {
    return name === 'profile' ? profileText : this.draft()[name];
  }

  protected set(name: Field['name'], value: string): void {
    if (name !== 'profile') this.draft.update((draft) => ({ ...draft, [name]: value }));
  }

  protected errorOf(name: string): string | null {
    const rule = this.errors()[name]?.[0];
    return rule ? ruleText(name, rule) : null;
  }

  protected describedBy(field: Field): string {
    const id = `t-${field.name}`;
    return [`${id}-help`, field.kind === 'datetime' && this.value(field.name) ? `${id}-text` : '', this.errorOf(field.name) ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ');
  }

  protected focus(event: Event, name: string): void {
    event.preventDefault();
    this.document.getElementById(`t-${name}`)?.focus();
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.state() === 'saving') return;
    const configuration = toConfiguration(this.draft());
    const stored = this.stored();
    this.errors.set({});
    this.state.set('saving');
    try {
      if (stored) {
        this.accept(await firstValueFrom(this.api.saveTournament(this.organisation, stored.id, { expectedRevision: stored.revision, configuration })));
        this.state.set('saved');
        return;
      }

      const content = JSON.stringify(configuration);
      if (this.attempt?.content !== content) this.attempt = { id: crypto.randomUUID(), content };
      const created = await firstValueFrom(this.api.createTournament<TournamentDetails>(this.organisation, { tournamentId: this.attempt.id, configuration }));
      this.accept(created);
      // The address becomes the tournament's; the page that opens there finds it already loaded.
      await this.router.navigate(['..', created.id], { relativeTo: this.route, replaceUrl: true, state: { saved: true } });
    } catch (error) {
      // Lost access shows its own state; nothing to add here.
      if (this.access.problem()) return;
      const rejected = problemOf<HttpValidationProblemDetails>(error)?.errors;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (status === 400 && rejected) {
        this.errors.set(rejected);
        this.state.set('editing');
        setTimeout(() => this.summary()?.nativeElement.focus());
      } else if (status === 409 && stored) {
        this.state.set('conflict');
      } else {
        // A conflict on creation means this identifier is taken by something else: the next attempt gets a new one.
        if (status === 409) this.attempt = null;
        this.state.set('failed');
      }
    }
  }

  /** Replaces what was typed with the stored tournament, only after the person agrees to lose it. */
  protected async reloadLatest(): Promise<void> {
    if (!this.confirm('Discard your unsaved input? It is not saved anywhere.')) return;
    const latest = (await this.tournament.refetch()).data;
    if (latest) {
      this.accept(latest);
      this.errors.set({});
      this.state.set('editing');
    }
  }

  /** A registration change answers with the tournament; the configuration typed meanwhile cannot differ (the action needs no unsaved changes). */
  protected registrationChanged(details: TournamentDetails): void {
    this.accept(details);
    this.state.set('editing');
  }


  private accept(details: TournamentDetails): void {
    this.queries.setQueryData(tournamentKey(this.organisation, details.id), details);
    void this.queries.invalidateQueries({ queryKey: tournamentsKey(this.organisation) });
    this.stored.set(details);
    this.draft.set(fromConfiguration(details.configuration));
    this.baseline.set(JSON.stringify(this.draft()));
  }

  /** R-4: nothing is preselected, except the reference time zone, proposed from the browser. */
  private initial(): Draft {
    const proposed = this.isNew ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
    return { ...empty, timeZone: zones().includes(proposed) ? proposed : '' };
  }
}
