## Purpose

How pages of the admin and public applications use the width of the screen, where secondary content goes, and how visual weight is distributed, so future screens share one composition.

## ADDED Requirements

### Requirement: Admin pages use the full width
Each admin page SHALL fill the content area beside the navigation rail, or under the top bar for a page without it, with no maximum width. A paragraph of running text SHALL be limited to about 75 characters per line, whatever the width of its container; notices and panels fill theirs. Layout SHALL change at one breakpoint only: below 700 px content stacks in one column with narrower gutters.

#### Scenario: An operational page on a wide screen
- **WHEN** an owner opens the tournament list on a 1920 px wide screen
- **THEN** the list fills the content area instead of a narrow column

#### Scenario: A short task
- **WHEN** a person opens the page that creates an organisation on a 1920 px wide screen
- **THEN** its panel fills the width under the top bar and its paragraphs keep a readable line length

#### Scenario: A narrow screen
- **WHEN** any admin page is shown 390 px wide
- **THEN** its content stacks in one column with no horizontal scrolling

### Requirement: Secondary content is stacked with the main content
A page with a summary or secondary sections SHALL show them in one column with its main content at every width, in the order the page states. A summary's action SHALL sit to the right of its text when there is room, and below it otherwise. A page title's status labels SHALL sit beside the title when there is room.

#### Scenario: The tournament configuration
- **WHEN** an owner opens a published tournament on a 1440 px wide screen
- **THEN** the state notice, the registration area and the entries summary, with "View entries" on its right, come before the configuration form, each across the full width

#### Scenario: The entries page
- **WHEN** an owner opens the entries of a tournament on a 1440 px wide screen
- **THEN** the summary comes first with its add action on the right, followed by the admitted, waiting and cancelled groups

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
