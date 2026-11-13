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
  - The two path groups (documentation, harness) are data at the top of the script. ADR 0017 and the classification itself are explicit exceptions that always count as code.
  - Rename detection is off, so a moved file lists its old path too.
  - Without a usable base, it prints `code=true`. That covers a new branch, an all-zero `before`, and a commit that cannot be fetched.
  - *Alternative:* `dorny/paths-filter`. Rejected: a third-party action with access to the token, and its patterns would live in two workflow files.
- **D-2 A `changes` job feeds the others.**
  - In `ci.yml`, `changes` checks out with depth 2 and runs the script:
    - for a pull request, from `HEAD^1` to `HEAD` of the merge commit GitHub builds, which is exactly the pull request's effect on its base;
    - for a push to `main`, from `before`, fetched by its hash.
  - `dotnet`, `web` and `test-scripts` declare `needs: changes` and run unless `changes` ran and printed `code=false`. A failed classification therefore runs them, and a draft, where `changes` is skipped, skips them.
  - `rules` always runs for a ready pull request or a push.
  - `e2e.yml` gains the same `changes` job, with `before`.
  - **Runs on `main` are never cancelled or queued behind each other.** Each merge's classification covers only its own changes. If a documentation-only merge cancelled or replaced a code merge's run, as `cancel-in-progress` and GitHub's single pending run per group would do, that code would never be checked. So on `main`:
    - each run has a concurrency group of its own commit;
    - pull requests keep cancelling their stale runs.
- **D-3 Drafts are not checked.**
  - `pull_request` gains the `ready_for_review` type.
  - Every job of `ci.yml`, `changes` included, runs only when the pull request is not a draft.
  - The local edit and commit hooks still run the rules while a pull request is a draft.
  - `CLAUDE.md` tells the agent to open a pull request as a draft and mark it ready when it asks for review or a test round.
- **D-5 The guard forgets a merged pull request** (`harness-resumption` D-2 left the flag set for the rest of the session).
  - A pull request tool records the current branch and `HEAD`, and starts the rounds again when the branch is a new one.
  - A GitHub event records them only when nothing was recorded yet, which is the case in a fresh container. A late event about a merged pull request must not tie the next change's commits to it.
  - Each counted push moves the recorded commit to the pushed `HEAD`, so a rebased pull request is still recognised.
  - Before refusing a push, the guard fetches `origin/main`. If the recorded commit is in it, the pull request has been merged: the flag and the rounds are cleared, and the push is a checkpoint.
  - On another branch the push is a checkpoint. A detached `HEAD` counts as the same branch.
  - This relies on merge commits, which is how Herald merges. A squash merge would leave the flag set until the branch changes or the maintainer's next message.
  - The guard reads git only for pushes and pull request tools, and fetches only when a push would be refused.
  - *Alternative:* clearing the flag at the maintainer's next message. Rejected: during a pull request's feedback rounds, the maintainer's messages would reopen unlimited pushes.
- **D-4 The `continuous-integration` specification changes.** "Every change is checked by CI" now states which checks run for which changes. The end-to-end requirement runs only for code, and "cancels stale runs" applies to pull requests only.

## Risks / Trade-offs

- **A file misclassified as documentation lets a broken build reach `main`** → the groups are small and explicit, anything unlisted is code, and each group has a test. The ADR 0017 exception has its own test.
- **A pull request merged while still a draft would have no checks** → GitHub does not allow merging a draft pull request.
- **The base cannot be fetched** → the script falls back to code, which costs minutes but loses no checks.
- **Branch protection may require checks by name** → skipped jobs report as skipped and satisfy it.

## Review (13 November 2026)

The `herald-reviewer` subagent reviewed the diff against this change. Findings and outcomes:

1. **Blocking: a code merge lost its checks when a documentation-only merge followed it.** `cancel-in-progress` on `main` cancelled its run, and the next classification looked only at its own changes.
   - **Fixed (D-2):** runs on `main` have a group per commit and are never cancelled or queued.
   - The requirement "cancels stale runs" now applies to pull requests only. It is the maintainer's to confirm on the pull request.
2. **A failed classification skipped the code jobs,** and a skipped job satisfies a required check. **Fixed:** they run unless the classification printed `code=false`.
3. **A renamed file showed only its new path.** **Fixed:** `--no-renames`, with a test that moves a file out of `src/`.
4. **A late GitHub event re-tied a merged pull request to the next change.** **Fixed:** events record a location only when none was recorded (D-5), with a test.
5. **"Merged" was judged against a stale `origin/main`, or never matched after a rebase.** **Fixed:**
   - the guard fetches `origin/main` before refusing a push;
   - each counted push moves the recorded commit;
   - squash merges are named as a limit (D-5).
6. **The push counter survived a merged pull request.** **Fixed:** it is cleared with the flag and on a new branch, with a test.
7. **D-2 did not describe the `HEAD^1` approach.** **Fixed.**
8. **`bootstrap.yml` ran on drafts.** **Fixed:** it gets the same draft condition, with a test.
9. **The classifier decided its own fate.** **Fixed:** `scripts/ci-changes.mjs` and its test always count as code.
10. **A push from a detached `HEAD` escaped the rounds.** **Fixed:** a detached `HEAD` counts as the same branch, with a test.
11. **A dead `pull_request` branch in `e2e.yml`.** **Fixed:** removed.

## Maintainer answers (13 November 2026)

- **Q-1 Rules on drafts:** no. Drafts run nothing, and the local edit and commit hooks check the rules (D-3 as written).

## Classification of recent merges (13 November 2026, task 4.4)

`node scripts/ci-changes.mjs <merge>^1 <merge>` run locally:

| Merge | Files | Result | Effect |
|---|---|---|---|
| #28 `h1-check-in` | 87 | `code=true` | every job, as before |
| #29 archive of `h1-check-in` | 13 | `code=false` | `rules` only |
| #30 `harness-resumption` | 21 | `code=false` | `rules` only |

#30 counts as harness because every file it changed is in `scripts/`, `.claude/`, `.githooks/` or the documentation. Each push after its pull request opened ran four jobs; with this change each would have run `rules` alone.
