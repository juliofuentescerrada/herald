## MODIFIED Requirements

### Requirement: Entries constrain the tournament's configuration
A save SHALL be rejected, naming the field, when it would set the capacity below the tournament's admitted entries, change the entry kind or the admission while the tournament has active (waiting or admitted) entries, or change the check-in policy while admitted entries have confirmed check-ins, as last reported by Registration. The configuration form SHALL show the entry kind and admission as unavailable while active entries exist, and the check-in policy as unavailable while confirmed check-ins exist, saying why, and SHALL say the lowest capacity allowed while entries are admitted.

#### Scenario: Capacity below the admitted entries
- **WHEN** an owner saves capacity 4 for a tournament with 5 admitted entries
- **THEN** the save is rejected naming the capacity and the stored configuration is unchanged

#### Scenario: Entry kind with active entries
- **WHEN** an owner saves a tournament with one waiting entry changing its entry kind from individual to team
- **THEN** the save is rejected naming the entry kind and the stored configuration is unchanged

#### Scenario: Entry kind after every entry was cancelled
- **WHEN** every entry of a tournament has been cancelled and an owner changes its entry kind
- **THEN** the save succeeds

#### Scenario: The form explains the locked fields
- **WHEN** an owner opens the configuration of a tournament with admitted entries
- **THEN** entry kind and admission are unavailable with the reason that entries exist, and the capacity field says the lowest value allowed

#### Scenario: Check-in policy with confirmed check-ins
- **WHEN** an owner saves a tournament with one confirmed check-in changing its check-in policy from mandatory to optional
- **THEN** the save is rejected naming the check-in policy and the stored configuration is unchanged

#### Scenario: Check-in policy with admitted entries and no check-ins
- **WHEN** an owner changes the check-in policy from optional to mandatory while entries are admitted but none has checked in
- **THEN** the save succeeds

#### Scenario: The form explains the locked check-in policy
- **WHEN** an owner opens the configuration of a tournament with confirmed check-ins
- **THEN** the check-in policy is unavailable with the reason that entries have checked in
