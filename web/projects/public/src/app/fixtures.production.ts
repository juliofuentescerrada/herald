import { Routes } from '@angular/router';
import { ServerRoute } from '@angular/ssr';

/** Replaces fixtures.ts in production builds: no fixture routes or code (W-05). */
export const fixtureRoutes: Routes = [];
export const fixtureServerRoutes: ServerRoute[] = [];
