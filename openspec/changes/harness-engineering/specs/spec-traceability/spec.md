## ADDED Requirements

### Requirement: Tests declare the scenarios they cover
.NET tests SHALL declare covered scenarios with a `Covers` attribute naming the capability and the scenario title, and Playwright journeys SHALL declare them with a `covers` annotation. A test MAY cover several scenarios.

#### Scenario: A marked test
- **WHEN** a test carries `Covers("team-rosters", "An owner adds a player to a waiting team")`
- **THEN** the coverage report lists that scenario as covered by that test

### Requirement: No new scenario without a test
A coverage script SHALL compare the scenarios in `openspec/specs/` with the markers. CI SHALL fail when a scenario is uncovered and not in the baseline, when a baseline entry has become covered but is still listed, or when a marker names no existing scenario. The baseline SHALL start with the scenarios uncovered when this change is implemented.

#### Scenario: An archived change adds an uncovered scenario
- **WHEN** a specification gains a scenario that no test marks and the baseline does not list
- **THEN** CI fails and names the capability and the scenario

#### Scenario: A renamed scenario
- **WHEN** a scenario's title changes and a test still marks the old title
- **THEN** CI fails, naming the dangling marker and its test

#### Scenario: Covering a scenario from the baseline
- **WHEN** a test starts covering a scenario listed in the baseline
- **THEN** CI fails until the scenario is removed from the baseline, so the baseline only shrinks
