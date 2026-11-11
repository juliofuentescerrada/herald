## Purpose

How pages of the admin and public applications use the width of the screen, where secondary content goes, and how visual weight is distributed, so future screens share one composition.

## ADDED Requirements

### Requirement: Admin pages use one of three named widths
Each admin page SHALL use one of three content widths: focused, about 720 px, for a single short task; form, about 960 px, for a long form; wide, filling the available width up to about 1440 px, for operational pages such as lists and entries. A paragraph of running text SHALL be limited to about 75 characters per line, whatever the width of its container. Layout SHALL change at two breakpoints only: below 700 px content stacks in one column, and from 1200 px a page may show an aside.

#### Scenario: An operational page on a wide screen
- **WHEN** an owner opens the tournament list on a 1600 px wide screen
- **THEN** the list fills the content area up to the wide limit instead of a narrow column

#### Scenario: A short task
- **WHEN** a person opens the page that creates an organisation
- **THEN** its content uses the focused width

#### Scenario: A narrow screen
- **WHEN** any admin page is shown 390 px wide
- **THEN** its content stacks in one column with no horizontal scrolling

### Requirement: Secondary content goes in an aside on wide screens
From 1200 px, a page with a summary or secondary sections SHALL show them in an aside about 320 px wide beside its main content; below 1200 px the aside SHALL appear in reading order before or after the main content, as each page states.

#### Scenario: The tournament configuration
- **WHEN** an owner opens a published tournament on a 1440 px wide screen
- **THEN** the configuration form uses the form width and the registration and entries sections are in an aside beside it

### Requirement: Public content is capped at 1200 px
Public pages SHALL cap their content at 1200 px and keep a fluid outer gutter of the larger of 5 % of the viewport and 24 px.

#### Scenario: The public home on a wide screen
- **WHEN** a visitor opens the public home on a 1920 px wide screen
- **THEN** its content is no wider than 1200 px and is centred

### Requirement: Visual weight follows what a person can act on
On a page that shows records a person can act on together with records that are history only, the actionable records SHALL come first at full weight; read-only history SHALL be shown compactly after them, collapsed by default when it would compete with them, with its count visible while collapsed, and omitted when empty. A summary SHALL state what waits for the person's decision when there is something.

#### Scenario: History is collapsed
- **WHEN** an owner opens the entries of a tournament with five cancelled entries
- **THEN** the cancelled entries are a collapsed group headed with their count, after the admitted and waiting entries

#### Scenario: No history
- **WHEN** a tournament has no cancelled entries
- **THEN** its entries page shows no cancelled group
