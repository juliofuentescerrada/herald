## Context

On 13 November 2026 the private repository reached its GitHub Actions usage limit. On pull request #30, the jobs took about 1.5 minutes (`rules`), 3 minutes (`test-scripts`), 2.7 minutes (`web`) and 3.5 minutes (`dotnet`), about 12 billed minutes per push because each job is rounded up separately. A merge to `main` repeats `ci.yml` and adds `e2e.yml`. `bootstrap.yml` already filters by path and is unchanged.

Findings that shape the design:

- **`paths-ignore` stops a workflow from starting at all.** A workflow that does not start never reports its checks, and a required check then waits forever. A job skipped by an `if:` condition reports as skipped, which satisfies a required check.
- **`NotifiableFactsTests` reads ADR 0017's inventory,** so that one document is code for the `dotnet` job.
- **Some non-production files are already checked by `rules`:**
  - `rules` runs `node --test scripts/*.test.mjs`, which tests the scripts, the guard (`.claude/hooks/guard.mjs`), the settings and the git hooks;
  - it also checks spelling, forbidden terms, licences and scenario coverage on every file.

  Changes to those files need `rules` only.
- **`prototypes/frontend/` is static HTML,** which neither the build nor any test reads.
- **A runner can read the changed files without third-party actions:** the default `ubuntu-latest` image has Node, and a shallow checkout can diff two commits after fetching them.

## Goals / Non-Goals

**Goals:**
- A documentation or harness push costs one `rules` job, about 2 minutes.
- Draft pull requests cost nothing.
- The classification is maintained in one place and tested.
- Nothing that can break the build or a test escapes its job.

**Non-Goals:**
- Faster code jobs (caching, splitting).
- A self-hosted runner.
- Making the repository public.

## Decisions

- **D-1 One script classifies.**
  - `scripts/ci-changes.mjs <base> <head>` lists the changed files with `git diff --name-only` and prints `code=true` or `code=false` in the format of `$GITHUB_OUTPUT`.
  - The two path groups (documentation, harness) are data at the top of the script, with ADR 0017 as an explicit exception.
  - Without a usable base, it prints `code=true`. That covers a new branch, an all-zero `before`, and a commit that cannot be fetched.
  - *Alternative:* `dorny/paths-filter`. Rejected: a third-party action with access to the token, and its patterns would live in two workflow files.
- **D-2 A `changes` job feeds the others.**
  - In `ci.yml`, `changes` checks out with depth 1, fetches the base, and runs the script. The base is `pull_request.base.sha` for pull requests and `before` for pushes to `main`.
  - `dotnet`, `web` and `test-scripts` declare `needs: changes` and run when `code == 'true'`.
  - `rules` always runs for a ready pull request or a push.
  - `e2e.yml` gains the same `changes` job.
  - Diffing a pull request against the base tip, not the merge base, can include changes merged to `main` since the branch started. That errs towards running the code jobs, which is safe.
- **D-3 Drafts are not checked.**
  - `pull_request` gains the `ready_for_review` type.
  - Every job of `ci.yml`, `changes` included, runs only when the pull request is not a draft.
  - The local edit and commit hooks still run the rules while a pull request is a draft.
  - `CLAUDE.md` tells the agent to open a pull request as a draft and mark it ready when it asks for review or a test round.
- **D-5 The guard forgets a merged pull request** (`harness-resumption` D-2 left the flag set for the rest of the session).
  - When the guard learns that the session has a pull request, it records the current branch and `HEAD`.
  - Before counting a push, it compares them with the repository:
    - on another branch, the push is a checkpoint;
    - once the recorded commit is an ancestor of `origin/main`, the pull request has been merged, the flag is cleared and the push is a checkpoint.
  - It reads git only for pushes, so other tool calls pay nothing.
  - *Alternative:* clearing the flag at the maintainer's next message. Rejected: during a pull request's feedback rounds, the maintainer's messages would reopen unlimited pushes.
- **D-4 The `continuous-integration` specification changes.** "Every change is checked by CI" now states which checks run for which changes, and the end-to-end requirement runs only for code.

## Risks / Trade-offs

- **A file misclassified as documentation lets a broken build reach `main`** → the groups are small and explicit, anything unlisted is code, and each group has a test. The ADR 0017 exception has its own test.
- **A pull request merged while still a draft would have no checks** → GitHub does not allow merging a draft pull request.
- **The base cannot be fetched** → the script falls back to code, which costs minutes but loses no checks.
- **Branch protection may require checks by name** → skipped jobs report as skipped and satisfy it.

## Maintainer answers (13 November 2026)

- **Q-1 Rules on drafts:** no. Drafts run nothing, and the local edit and commit hooks check the rules (D-3 as written).
