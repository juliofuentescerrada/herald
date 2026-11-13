# interface-icons Specification

## Purpose
TBD - created by archiving change ui-icons. Update Purpose after archive.
## Requirements
### Requirement: Admin navigation shows an icon with each item
Each item of the admin rail's workspace navigation SHALL show a Tabler outline icon at the navigation size (24 px) before its label, on desktop and in the mobile bar. The label SHALL stay visible and SHALL remain the item's accessible name.

#### Scenario: The rail's items carry their icons
- **WHEN** an owner opens any page of an organisation's workspace
- **THEN** "Overview" and "Tournaments" each show their icon before the label, and each link's accessible name is its label alone

### Requirement: Status labels show an icon for their meaning
A status label SHALL show, before its text, the icon of its meaning at the metadata size (16 px): the tournament's publication, registration and competition labels and the entry's check-in labels. The text SHALL stay and SHALL carry the meaning; the icon SHALL be hidden from assistive technology. A status SHALL NOT be conveyed by its icon or colour alone.

#### Scenario: Lifecycle labels carry icons
- **WHEN** an owner opens the tournament list with a draft and a published tournament whose registration is open
- **THEN** "Draft", "Published", "Registration open" and "Preparing" each show their icon before the text, and the icons are hidden from assistive technology

#### Scenario: Check-in labels carry icons
- **WHEN** an owner opens the entries page with one entry checked in and one pending
- **THEN** "Checked in" and "Check-in pending" each show their icon before the text

### Requirement: Links to another page show an icon
A link that goes back to a parent page SHALL show a back arrow before its text, and a link to a tournament's entries SHALL show the entries icon before its text, at the control size (20 px) in link buttons and the metadata size in text links. Their accessible names SHALL not change.

#### Scenario: Back and entries links carry icons
- **WHEN** an owner opens a published tournament's configuration
- **THEN** "Back to tournaments" shows the back arrow and "View entries" shows the entries icon, with unchanged accessible names

### Requirement: Empty panels show an icon
A panel that says a list has nothing yet SHALL show the icon of that list's content above its heading, at the empty-state size, hidden from assistive technology.

#### Scenario: An empty tournament list carries its icon
- **WHEN** an owner opens the tournament list of an organisation with no tournaments
- **THEN** "No tournaments yet" shows the tournaments icon above the heading, hidden from assistive technology

#### Scenario: An empty field carries its icon
- **WHEN** an owner opens the entries page of a tournament with no entries
- **THEN** "No entries yet" shows the entries icon above the heading

