import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '@herald/ui';
import { ORGANISER_WORKSPACE_URL } from './platform';

/** The representative static page: prerendered, with no discovery, sign-in or registration. */
@Component({
  selector: 'app-home-page',
  imports: [Button],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly workspaceUrl = inject(ORGANISER_WORKSPACE_URL);
}
