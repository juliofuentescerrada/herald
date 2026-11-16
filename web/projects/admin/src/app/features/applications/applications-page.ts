import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal, TemplateRef, viewChild, ViewContainerRef } from '@angular/core';
import { GrantDetails, HeraldHostAdminService, OperationGroup, problemOf, TournamentSummary } from '@herald/api-client/admin';
import { Button, Dialog, DialogContext, DialogRef, Dialogs, Icon, Notice, StatusLabel, Toasts } from '@herald/ui';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { AccessState, AppContext, CONFIRM, injectWorkingOrganisation, QUERY_CLIENT, tournamentsKey } from '../../platform';
import { grantsKey, groupLabel, groups, identifierPattern, scopeText, whenText } from './applications';

type Errors = Partial<Record<'name' | 'applicationId' | 'tournaments' | 'groups', string>>;

/** The organisation's pilot applications: who may act for it, within which tournaments and operations (pilot-access D-5). */
@Component({
  selector: 'app-applications-page',
  imports: [Button, Dialog, Icon, Notice, StatusLabel],
  templateUrl: './applications-page.html',
  styleUrl: './applications-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsPage {
  private readonly api = inject(HeraldHostAdminService);
  private readonly queries = inject(QUERY_CLIENT);
  private readonly access = inject(AccessState);
  private readonly confirm = inject(CONFIRM);
  private readonly dialogs = inject(Dialogs);
  private readonly toasts = inject(Toasts);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly organisationId = inject(AppContext).organisation()!;
  private readonly grantDialog = viewChild.required<TemplateRef<DialogContext>>('grantDialog');
  private open: DialogRef | null = null;
  // The identifier of this attempt, kept for retries of the same content (as for organisations, D-5).
  private attempt: { id: string; content: string } | null = null;

  protected readonly organisation = injectWorkingOrganisation();
  protected readonly grants = injectQuery(() => ({
    queryKey: grantsKey(this.organisationId),
    queryFn: () => firstValueFrom(this.api.listGrants(this.organisationId)),
    retry: false,
  }));
  protected readonly tournaments = injectQuery(() => ({
    queryKey: tournamentsKey(this.organisationId),
    queryFn: () => firstValueFrom(this.api.listTournaments(this.organisationId)),
    retry: false,
  }));
  protected readonly titles = computed(() => new Map((this.tournaments.data() ?? []).map((t: TournamentSummary) => [t.id, t.title])));

  protected readonly groups = groups;
  protected readonly groupLabel = groupLabel;
  protected readonly when = whenText;
  protected readonly scope = (grant: GrantDetails) => scopeText(grant, this.titles());

  // The grant form.
  protected readonly name = signal('');
  protected readonly applicationId = signal('');
  protected readonly allTournaments = signal(true);
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly chosen = signal<readonly OperationGroup[]>([]);
  protected readonly errors = signal<Errors>({});
  protected readonly busy = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly revokeFailure = signal<string | null>(null);

  protected askGrant(trigger: HTMLElement): void {
    this.name.set('');
    this.applicationId.set('');
    this.allTournaments.set(true);
    this.selected.set([]);
    this.chosen.set([]);
    this.errors.set({});
    this.failure.set(null);
    this.attempt = null;
    const open = this.dialogs.open(this.grantDialog(), { trigger, viewContainerRef: this.viewContainerRef });
    this.open = open;
    void open.closed.then(() => {
      if (this.open === open) this.open = null;
    });
  }

  protected toggleTournament(id: string, on: boolean): void {
    this.selected.update((ids) => (on ? [...ids, id] : ids.filter((other) => other !== id)));
    this.errors.update((errors) => ({ ...errors, tournaments: undefined }));
  }

  protected toggleGroup(group: OperationGroup, on: boolean): void {
    this.chosen.update((chosen) => (on ? [...chosen, group] : chosen.filter((other) => other !== group)));
    this.errors.update((errors) => ({ ...errors, groups: undefined }));
  }

  protected async grant(): Promise<void> {
    if (this.busy()) return;
    const body = {
      name: this.name().trim(),
      applicationId: this.applicationId().trim(),
      tournaments: this.allTournaments() ? null : [...this.selected()],
      groups: groups.map((g) => g.group).filter((group) => this.chosen().includes(group)),
    };
    const errors: Errors = {};
    if (!body.name) errors.name = 'Give the application a name.';
    else if (body.name.length > 80) errors.name = 'Use at most 80 characters.';
    if (!identifierPattern.test(body.applicationId)) errors.applicationId = 'Enter the identifier as given: 32 hexadecimal digits with hyphens.';
    if (body.tournaments?.length === 0) errors.tournaments = 'Choose at least one tournament, or all of them.';
    if (body.groups.length === 0) errors.groups = 'Choose at least one operation.';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;

    const content = JSON.stringify(body);
    if (this.attempt?.content !== content) this.attempt = { id: crypto.randomUUID(), content };
    this.busy.set(true);
    this.failure.set(null);
    try {
      const granted = await firstValueFrom(this.api.grantApplication(this.organisationId, this.attempt.id, body));
      this.queries.setQueryData<GrantDetails[]>(grantsKey(this.organisationId), (grants = []) => [granted, ...grants.filter((g) => g.id !== granted.id)]);
      this.toasts.show(`${granted.name} can act within its grant.`);
      this.open?.close();
    } catch (error) {
      if (this.access.problem()) return;
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.failure.set(
        status === 409 && problemOf<{ type?: string }>(error)?.type === 'application-already-granted'
          ? 'This application already has access to the organisation. Revoke its grant first to change what it may do.'
          : 'The request failed. Nothing changed. Try again.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async revoke(grant: GrantDetails): Promise<void> {
    const confirmed = await this.confirm({
      heading: `Revoke ${grant.name}?`,
      body: `${grant.name} stops acting for ${this.organisation.data()?.name ?? 'this organisation'} from its next request. Results it recorded stay, attributed to it.`,
      confirmLabel: 'Revoke',
      leaveLabel: 'Keep access',
      destructive: true,
    });
    if (!confirmed) return;
    this.revokeFailure.set(null);
    try {
      const revoked = await firstValueFrom(this.api.revokeGrant(this.organisationId, grant.id));
      this.queries.setQueryData<GrantDetails[]>(grantsKey(this.organisationId), (grants = []) => grants.map((g) => (g.id === revoked.id ? revoked : g)));
      this.toasts.show(`${grant.name} no longer has access.`);
    } catch {
      if (this.access.problem()) return;
      this.revokeFailure.set(`${grant.name} still has access: the request failed and nothing changed. Try again.`);
    }
  }

  protected close(): void {
    this.open?.close();
  }
}
