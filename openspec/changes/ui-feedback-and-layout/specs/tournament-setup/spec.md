## MODIFIED Requirements

### Requirement: The configuration form keeps input and explains errors
The admin application SHALL present the configuration as one form. Individual tournaments SHALL show no team structure fields; choosing team SHALL reveal them and label capacity in teams without clearing other input. Choosing online SHALL hide the venue. No value SHALL be preselected, except that the reference time zone is proposed from the browser. The competition profile SHALL be shown read-only. Each date-time field SHALL also show its value written as "14 November 2026, 10:00".

A successful save SHALL be announced as a toast, together with what publication still lacks when the draft is incomplete. A rejected, failed or conflicting save SHALL keep everything typed. Field errors SHALL appear at their field, associated with its control and distinguishable without relying on colour, and in a summary whose items move focus to the field. A draft with values missing for publication SHALL list them the same way and SHALL explain why review and publication are unavailable. Leaving the form with unsaved input SHALL ask first.

#### Scenario: An owner switches a draft to team
- **WHEN** an owner who has typed a title changes entry kind to team
- **THEN** the roster and active-player fields appear, capacity is labelled in teams and the title is still there

#### Scenario: A save is rejected
- **WHEN** a save is rejected for two field rules
- **THEN** both errors are shown at their fields and in the summary, focus moves to the summary, and every typed value is kept

#### Scenario: A save fails
- **WHEN** the save request fails for a reason other than its content
- **THEN** the form says the save failed, keeps every typed value and offers a retry

#### Scenario: A save conflicts
- **WHEN** a save is rejected because the tournament changed elsewhere
- **THEN** the form says so, keeps every typed value, does not overwrite the stored tournament, and offers "Reload latest", which replaces the typed values only after the owner confirms

#### Scenario: A draft is not ready to publish
- **WHEN** an owner opens a draft with no reference time zone
- **THEN** the form lists the time zone as missing for publication, the item moves focus to that field, and review is unavailable with that explanation

#### Scenario: An owner leaves with unsaved input
- **WHEN** an owner navigates away from a form with unsaved changes
- **THEN** the application asks before discarding them, and declining keeps the page and the input

#### Scenario: A save succeeds
- **WHEN** an owner saves a published tournament and the save succeeds
- **THEN** a toast says the changes were saved, and no persistent success notice remains on the page
