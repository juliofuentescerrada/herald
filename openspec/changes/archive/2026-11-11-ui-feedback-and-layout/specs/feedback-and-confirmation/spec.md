## Purpose

Where both applications show the outcome of a person's action and its errors, and how they confirm consequential actions and run multi-step flows, so every screen gives feedback the same way.

## ADDED Requirements

### Requirement: Outcomes are announced as toasts
The outcome of a person's own completed action SHALL be announced as a toast: a short message in one stack, at the bottom right on a wide screen and along the bottom on a narrow one, announced politely to assistive technology. A toast SHALL NOT be the only place where information needed later appears, and SHALL NOT hold the only way to perform an action. A page rendered on the server SHALL show no toast before it runs in the browser.

#### Scenario: An action succeeds
- **WHEN** an owner admits an entry and the admission succeeds
- **THEN** a toast says the entry was admitted, the page shows the entry among the admitted ones, and the toast disappears by itself

### Requirement: Toasts can be read and leave with their context
A toast SHALL disappear by itself after at least five seconds, SHALL stay while the pointer is over it or it has focus, and SHALL be dismissible. The toasts of one organisation SHALL be removed when the working organisation or the signed-in person changes.

#### Scenario: A toast is read slowly
- **WHEN** a person moves focus to a toast before it disappears
- **THEN** the toast stays until focus leaves it or the person dismisses it

#### Scenario: The organisation changes
- **WHEN** a person switches organisation while a toast is shown
- **THEN** the toast is removed

### Requirement: Errors stay where they arose
An error SHALL NOT be announced only as a toast. A field error SHALL appear at its field and in the form's summary. A failed action started from a dialog or a drawer SHALL be explained inside it, which SHALL stay open with what was typed and offer a retry. A conflict, or a state that blocks actions, SHALL be explained by a notice on the page that stays until it is resolved or the page is reloaded.

#### Scenario: An action in a dialog fails
- **WHEN** the request of a confirmed cancellation fails
- **THEN** the dialog stays open, says the cancellation was not made and nothing changed, and offers to try again

#### Scenario: A conflict
- **WHEN** a write is rejected because the record changed elsewhere
- **THEN** a notice on the page says so and offers to reload, and no toast replaces it

### Requirement: Consequential actions are confirmed in a modal dialog
An action with consequences that can be decided with one question and at most a short input SHALL be confirmed in a modal dialog. Its title SHALL be the question; it SHALL state the consequence and, when there is one, its effect on other records; it SHALL offer a confirming action, marked as destructive when it destroys something, and an action that leaves everything unchanged. On a narrow screen the dialog SHALL span the width of the screen.

#### Scenario: A confirmation needs a reason
- **WHEN** an owner admits an entry ahead of an earlier one in the capacity queue
- **THEN** a dialog asks for the private reason and its confirming action is unavailable until a reason is typed

### Requirement: Dialogs keep focus and requests under control
Escape and a dialog's leaving action SHALL close it without any change. While it is open, focus SHALL stay inside it and the page behind SHALL not be operable; when it closes, focus SHALL return to the control that opened it, or to the nearest meaningful element when that control no longer exists. While its request is in progress the dialog SHALL not close and its actions SHALL not repeat the request.

#### Scenario: A person keeps the record
- **WHEN** a person opens the cancellation dialog of an entry and presses Escape
- **THEN** the dialog closes, nothing changes and focus returns to that entry's "Cancel entry" control

#### Scenario: A confirmation is in progress
- **WHEN** an owner confirms a cancellation and its request has not answered yet
- **THEN** the dialog stays open, its confirming action shows it is busy, and pressing it again sends nothing

### Requirement: Multi-step flows that keep their context open in a drawer
A flow of several steps that benefits from keeping the page in view SHALL open in a drawer at the side of the page on a wide screen and over the whole screen on a narrow one. A drawer SHALL follow the dialog's rules for focus, Escape and requests in progress, and SHALL keep what was typed when one of its requests fails.

#### Scenario: Adding a player
- **WHEN** an owner chooses "Add player" on a wide screen
- **THEN** a drawer opens beside the entries with the search and creation of a guest, and the entries stay visible behind it

### Requirement: Long reviews are pages and reversible actions act at once
A review of many values before a consequential action SHALL be its own page. An action that is reversible and changes nothing else SHALL take effect without a confirmation.

#### Scenario: Admitting in order
- **WHEN** an owner admits the first entry waiting for a slot
- **THEN** the entry is admitted without a confirmation and a toast says so
