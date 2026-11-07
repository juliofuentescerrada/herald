## ADDED Requirements

### Requirement: Each maintained document has a defined responsibility
The repository SHALL identify the maintained sources for product rules, architecture, delivery, visual contracts and implementation status. Explanatory presentations, mockups and prototypes SHALL reference that baseline rather than introduce independent rules.

#### Scenario: A reader moves from a mockup to its rules
- **WHEN** a reader consults the visual guide or presentation notes
- **THEN** the baseline version and functional source are identifiable and conceptual/sample states are distinguished from accepted requirements

### Requirement: Design status is explicit
Documentation SHALL distinguish confirmed scope, proposed defaults and implemented functionality. Accepted specifications SHALL continue to describe the implemented system; target migrations SHALL remain in their proposed changes until implemented and archived.

#### Scenario: Target slices coexist with the skeleton
- **WHEN** a reader compares ADR 0004 with the implemented module-boundaries specification
- **THEN** the documentation identifies the current skeleton and the change that owns migration to slices without claiming the migration has happened

### Requirement: Review findings have traceable closure
The consolidation record SHALL map both review finding sets to maintained resolutions and remaining decision or implementation gates. Historical reviews and their input manifests SHALL retain their snapshot identity.

#### Scenario: A proposed product rule closes a documentation gap
- **WHEN** an outcome or access policy is documented following a review finding
- **THEN** its proposed status, acceptance example and decision gate remain visible instead of being presented as implicitly approved

### Requirement: Visual support states its coverage and limitations
Visual references and static prototypes SHALL identify the journeys and states they cover, the intended milestone and the absence of production services. New result entry SHALL require an explicit outcome selection. Visual quality evidence SHALL state the inspected surfaces and use the Refactoring UI diagnostic without generalising a sample to the whole future product.

#### Scenario: A reviewer starts a new result
- **WHEN** the individual prototype opens a new result form
- **THEN** no entrant is preselected as winner and confirmation stays unavailable until an outcome is chosen

#### Scenario: A reviewer follows a team journey
- **WHEN** a reviewer opens the H1 team prototype
- **THEN** roster capacity, starting lineup and readiness blockers can be distinguished and the view is identified as a static design artefact
