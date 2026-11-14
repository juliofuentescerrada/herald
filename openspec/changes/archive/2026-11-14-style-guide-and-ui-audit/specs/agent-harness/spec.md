## ADDED Requirements

### Requirement: UI agents load the same local design guidance
The repository SHALL include an original, attributed Refactoring UI practice skill with no external installation requirement. Claude Code and Codex entry points and OpenSpec's context/rules SHALL route UI proposals, mockups, implementation and reviews to that skill and the maintained style/component/icon guidance. Codex skill discovery SHALL resolve to the canonical skill sources rather than copies. The workflow SHALL require no Impeccable plugin.

#### Scenario: A fresh agent finds the UI guidance
- **WHEN** the repository's Claude Code, Codex and OpenSpec entry points are inspected
- **THEN** they identify the same local practice skill and UI documentation, and every Codex skill link resolves to its canonical source
