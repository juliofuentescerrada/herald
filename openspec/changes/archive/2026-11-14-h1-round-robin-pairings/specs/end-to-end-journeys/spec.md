## MODIFIED Requirements

### Requirement: The critical journeys are covered
The suite SHALL cover these journeys, each as one test named as a sentence:

1. A visitor on the public page follows Sign in to the admin application.
2. A signed-out person opening a deep link signs in and returns to that address.
3. A newcomer creates an organisation, lands in its workspace with the created notice, and sees its name in the rail.
4. An owner of two organisations switches through the selector, and another tab of the application reloads into its own organisation.
5. A person opening another owner's organisation by its address sees the generic denial, with nothing of that organisation.
6. A person not assigned to Herald is shown "Herald access is by invitation".
7. A session that expires while a person types sees "Sign in again", with their input kept for copying and nothing submitted.
8. Leaving the creation form with typed input asks first, and declining keeps the page and the input.
9. Signing out reloads the application's other tabs and asks for sign-in again.
10. An owner creates a draft tournament with only a title, sees what it lacks for publication, completes it, reviews it and publishes it, and the list shows it as published with registration not open.
11. An owner saving a tournament that changed in another tab sees the conflict with their input kept, and the other tab's change is intact.
12. An owner opens the registration of a published tournament, sees it open in the list, closes it and reopens it.
13. An owner enters players in an individual tournament with automatic admission until it is full, sees the next one wait, cancels an admitted entry and sees the waiting one admitted.
14. An owner enters teams in a team tournament with manual admission, is warned of a possible duplicate team and enters the existing one, and admits a pending team.
15. An owner builds a team's roster to its minimum, is stopped from adding a player who is on another team's roster, and sees the team's roster complete.
16. An owner checks in two admitted players, undoes one of the check-ins, and sees the entries page count 1 of 2 checked in.
17. An owner marks a pending player absent, generates a schedule for five players with one rest each, publishes it, withdraws it with a reason and publishes it again.

#### Scenario: Each journey checks what the person sees
- **WHEN** a journey runs
- **THEN** it asserts on roles, labels and text a person perceives, not on implementation details such as CSS classes or stored state
