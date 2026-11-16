import { Routes } from '@angular/router';
import { confirmLeave, inOrganisation, resolveHome, signedIn } from './platform';

const notFound = {
  path: '**',
  title: 'Page not found · Herald',
  loadComponent: () => import('./not-found-page').then((m) => m.NotFoundPage),
};

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [signedIn],
    children: [
      { path: '', pathMatch: 'full', canActivate: [resolveHome], children: [] },
      {
        path: 'organisations',
        pathMatch: 'full',
        title: 'Choose an organisation · Herald',
        loadComponent: () => import('./features/organisations').then((m) => m.OrganisationSelectorPage),
      },
      {
        path: 'organisations/new',
        title: 'Create an organisation · Herald',
        data: { standalone: true },
        canDeactivate: [confirmLeave],
        loadComponent: () => import('./features/organisations').then((m) => m.CreateOrganisationPage),
      },
      {
        path: 'organisations/:organisationId',
        canActivate: [inOrganisation],
        children: [
          { path: '', title: 'Overview · Herald', loadComponent: () => import('./overview-page').then((m) => m.OverviewPage) },
          {
            path: 'switch',
            title: 'Choose an organisation · Herald',
            loadComponent: () => import('./features/organisations').then((m) => m.OrganisationSelectorPage),
          },
          {
            path: 'tournaments',
            title: 'Tournaments · Herald',
            loadComponent: () => import('./features/tournaments').then((m) => m.TournamentListPage),
          },
          {
            path: 'applications',
            title: 'Applications · Herald',
            loadComponent: () => import('./features/applications').then((m) => m.ApplicationsPage),
          },
          {
            path: 'tournaments/new',
            title: 'Create tournament · Herald',
            canDeactivate: [confirmLeave],
            loadComponent: () => import('./features/tournaments').then((m) => m.TournamentFormPage),
          },
          {
            path: 'tournaments/:tournamentId',
            title: 'Tournament · Herald',
            canDeactivate: [confirmLeave],
            loadComponent: () => import('./features/tournaments').then((m) => m.TournamentFormPage),
          },
          {
            path: 'tournaments/:tournamentId/review',
            title: 'Review before publishing · Herald',
            loadComponent: () => import('./features/tournaments').then((m) => m.TournamentReviewPage),
          },
          {
            path: 'tournaments/:tournamentId/entries',
            title: 'Entries · Herald',
            loadComponent: () => import('./features/entries').then((m) => m.EntriesPage),
          },
          {
            path: 'tournaments/:tournamentId/schedule',
            title: 'Schedule · Herald',
            loadComponent: () => import('./features/schedule').then((m) => m.SchedulePage),
          },
          {
            path: 'tournaments/:tournamentId/standings',
            title: 'Standings · Herald',
            loadComponent: () => import('./features/standings').then((m) => m.StandingsPage),
          },
          {
            path: 'tournaments/:tournamentId/matches/:matchId',
            canDeactivate: [confirmLeave],
            title: 'Match · Herald',
            loadComponent: () => import('./features/matches').then((m) => m.MatchPage),
          },
          notFound,
        ],
      },
      notFound,
    ],
  },
];
