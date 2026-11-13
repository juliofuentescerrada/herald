## Context

ADR 0018 (Proposed, 12 November 2026) defines batches, a decision session, a proposals pull request with prototypes, unattended slices with a preview per pull request, and tracking in GitHub Issues. It reserves the flow for H2 and allows one slice in progress.

Since then the harness gained:
- resumption and per-task checkpoints (`harness-resumption`);
- CI by what changed and drafts that cost nothing (`ci-path-filters`);
- the private-data guard;
- a public repository with free Actions minutes.

H1's remaining slices are, in rough order:
- the round-robin schedule;
- locked lineups;
- operator-entered results;
- explainable standings;
- safe corrections;
- public and API reads.

M4, which brings the previews, waits for the shared platform (ADR 0012).

Findings that shape the design:
- **The GitHub tools this agent has cannot create labels, milestones or project boards;** the maintainer's `gh` can. Issues and sub-issues the agent can create.
- **The issue templates already exist** (`batch.yml`, `slice.yml`). The slice template has no field for dependencies.
- **Parallel sessions do not share the guard's state.** Each session's push rounds and budget are its own, so two slices in progress double the subscription use, which the metrics show.
- **The files that conflict most between slices are generated or shared:**
  - Wolverine's generated code;
  - the OpenAPI documents and client;
  - the EF Core model snapshot;
  - journey numbers;
  - the roadmap;
  - the uncovered-scenario baseline.

## Goals / Non-Goals

**Goals:**
- ADR 0018's flow can start with H1's next batch.
- Two independent slices can be implemented at once without colliding at merge.
- Tracking lives in GitHub from now on.
- The skills and templates describe the batched flow.

**Non-Goals:**
- The H1 batch map (its own documentation pull request).
- The scheduled tasks.
- M4.
- More than two slices in progress.

## Decisions

- **D-1 ADR 0018 revised in place.** It is Proposed, so it is refined rather than superseded.
  - The scope sentence becomes "H1's remaining slices onwards".
  - The test-round paragraph gains the local round until M4.
  - The "Merges drive the sessions" paragraph gains the parallel rule (D-3).
  - The follow-ups are updated with what this change delivers.
  - Its status becomes Accepted when this change is approved (Q-1).
- **D-2 Local test round until M4.**
  - The slice's pull request carries the test script derived from its scenarios, and its screenshots from the E2E environment (the `test-script-screens` artefact).
  - The maintainer reproduces it with `aspire run` and the seeded scenarios.
  - Feedback goes on the pull request, as with a preview.
  - *Alternative:* a preview inside the cloud session, behind its preview port (ADR 0018's fallback). Rejected for now: it lives only while the session does, and it needs a non-deployed environment with the fake identity provider reachable through one origin.
- **D-3 Two slices in progress, dependencies declared.**
  - The slice template gains "Depends on" (sub-issue numbers), and the batch issue lists its slices in order with their dependencies.
  - The next-slice run, by hand for the first H1 batch (Q-3), starts a slice only when its dependencies are merged and fewer than two slices are `in-progress`.
  - Test rounds and merges go one at a time: the maintainer tests one pull request, then the next.
  - Before marking a pull request ready for a test round, the agent:
    - merges `main` into it;
    - regenerates Wolverine's code and the OpenAPI client;
    - renumbers a journey that collides;
    - runs the checks.
  - Two slices that would both change the EF Core model of the same module are not run in parallel; the batch's dependency list says so.
  - *Alternative:* stacking slice branches. Rejected: feedback on the lower slice forces rebases of the upper one.
- **D-4 Tracking set up by script and by hand.**
  - `scripts/github-setup [--dry-run]` uses `gh` to create or update:
    - the labels `batch`, `slice`, `batch-proposals`, `needs-decision`, `in-progress`, `ready-to-test`, `feedback` and `agent:start`, with descriptions;
    - the milestones `H1 Operator league`, `M4 Cloud` and `H2 Participant portal`.

    It is idempotent and prints what it would do in dry-run mode, which is what its test checks.
  - The project board (Projects v2) needs a token scope the maintainer adds once. `docs/operations/delivery-tracking.md` describes the board's columns, which follow the status labels.
  - Later milestones (H3 onwards) are created when their first batch is near.
- **D-5 Skills, configuration and templates.**
  - `herald-screens`: for batched work, the agent generates navigable prototypes of each affected screen and state in `prototypes/frontend/`, following visual direction §4 and §7.2, and the batch's proposals pull request is where the maintainer reviews them. The rule "ask for mockups" stays for work outside a batch.
  - `herald-docs`: a slice archives its change in its own pull request; status lives in issues and the board, and the roadmap keeps milestones and exit criteria.
  - `openspec/config.yaml`: the design rule accepts prototypes from the batch's proposals pull request.
  - The pull request template gains sections for the test script and screenshots, the reviewer's findings, the harness metrics and the archive.

## Risks / Trade-offs

- **Two slices double the subscription use** → the metrics in each pull request show it; the limit stays two until they justify more.
- **Merge conflicts between parallel slices** → declared dependencies, the same-module model rule, and the merge and regeneration before each test round.
- **The maintainer's local round costs more of their time than a preview** → it is temporary until M4, and the test script and screenshots narrow what they check.
- **Labels and board drift from the script** → the script is idempotent and can be run again; the board follows the labels.

## Review (13 November 2026)

The `herald-reviewer` subagent reviewed the diff against this change. Nothing was blocking. Findings and outcomes:

1. **"In progress" was counted by the `in-progress` label, which a slice leaves when its pull request opens,** so a third slice could start before either was merged. **Fixed:** ADR 0018 defines in progress as from start until merge, whatever the label, with a test pinning it.
2. **One run per merge started only one slice.** **Fixed:** the run starts every eligible slice up to the limit, each in its own session.
3. **ADR 0019, the roadmap and parts of ADR 0018 still described the old process** (one slice, from H2, the preview as the only test round). **Fixed:** they now describe the local round until M4 and the batch's acceptance in that round.
4. **The archive steps still updated per-slice status in the roadmap and the README.** **Fixed:** for a batch's slice the closed issue is the status (herald-docs, the pull request template, `openspec/config.yaml`); a change outside a batch keeps its roadmap row.
5. **`agent:start` does nothing in the first batch, and the guide named the wrong task.** **Fixed** in ADR 0018 and the guide.
6. **`scripts/github-setup` ran for real on an unknown argument.** **Fixed:** it prints the usage and exits 2, with a test.
7. **Milestones were never updated.** **Fixed:** an existing one gets its description patched, and the milestone list is paginated. A test with a recording `gh` proves it, and that a second run is the same.
8. **The tests checked wording more than behaviour.**
   - **Fixed:**
     - the template test reads the "Depends on" field's own block;
     - the dry-run test checks each description;
     - the real run is tested.
   - The parallel rule stays procedural, so its test pins the definition from finding 1.
9. **The harness metrics were only an HTML comment.** **Fixed:** a `## Harness metrics` section.
10. **The issue templates and the E2E scripts' text still said "on its preview" and "the decision session".** **Fixed.**
11. **The same rules were stated in several places.** **Fixed:**
    - ADR 0018 holds the decision and the limit; `CLAUDE.md` holds the procedure; the templates, `openspec/config.yaml` and `herald-docs` refer to them;
    - the guide says who moves the board's cards.

## Maintainer answers (13 November 2026)

- **Q-1 ADR 0018:** accepted when this change is approved (D-1).
- **Q-2 H1 milestone:** issues only for the remaining work.
- **Q-3 Starting slices:** the first H1 batch is started by hand (the maintainer asks a session, or adds `agent:start`); the next-slice scheduled task is created after that batch.
