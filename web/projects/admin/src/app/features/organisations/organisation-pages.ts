import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The newcomer's landing; the creation form arrives with task 5.4. */
@Component({
  selector: 'app-create-organisation-page',
  template: `<h1>Create an organisation</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganisationPage {}

/** For a person with several organisations; the selector arrives with task 5.4. */
@Component({
  selector: 'app-organisation-selector-page',
  template: `<h1>Choose an organisation</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationSelectorPage {}
