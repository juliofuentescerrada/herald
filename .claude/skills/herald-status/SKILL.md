---
name: herald-status
description: Summarise where Herald's delivery stands: the roadmap's current state, the work done most recently and a recommended next task. Use when the maintainer asks for the status, a summary of the roadmap, what was done last, or what to do next ("where are we", "what's next"). Read-only.
---

# Herald status

A read-only briefing in three parts. It changes no file, label or issue; the maintainer decides what to start.

## Gather

Read each source by section, never whole (`docs/roadmap.md` is long), and run the commands in parallel:

- `node scripts/slice-state.mjs`: the branch, active changes with their approval and next unchecked task, the last checkpoint.
- `git log --oneline -15 main` and `git log --oneline -10` (the current branch, if not `main`); `git status --short`.
- `docs/roadmap.md`: the "Current state" table (`grep -n '^## ' docs/roadmap.md`, then read up to the next heading) and the batch section of the milestone in progress (its slices and "Depends on" columns).
- GitHub (`gh`, skip if not signed in and say so):
  - `gh pr list --state open --json number,title,isDraft,headRefName,labels`
  - `gh issue list --label slice --state open --json number,title,labels,milestone`
  - `gh issue list --label needs-decision --state open --json number,title`
  - `gh pr list --state merged --limit 5 --json number,title,mergedAt`

Issues and pull requests hold progress (ADR 0018, `docs/operations/delivery-tracking.md`); the roadmap holds milestones and exit criteria. Where they disagree, report the disagreement instead of picking one.

## Report

In the maintainer's language, short, with links as `path:line` or `#n`:

1. **Roadmap:** the milestone in progress, which of its slices are merged, in progress, ready to test or not started, and what remains of its exit criteria. One line for what follows it.
2. **Last done:** the last merged pull requests and the commits of the current branch not on `main`, grouped by change, with any task still unchecked or a branch not yet pushed.
3. **Next:** one recommendation and why, then at most two alternatives in one line each. Choose by this order:
   1. Finish what is open: an unchecked task of an approved change, a pull request with `feedback`, a CI failure, a merged change not yet archived.
   2. A slice waiting for the maintainer (`ready-to-test`, `needs-decision`): say what they must do; the agent cannot do it.
   3. A new slice, only if fewer than two are in progress (ADR 0018) and every slice in its "Depends on" is merged; without an approved change it starts with `/opsx:propose`.
   4. Otherwise the next milestone's decision session or batch proposal.

   A rule the decision register (`docs/herald-functional-discovery.md` §15) does not settle is a question for the maintainer, not part of the recommendation.

State what could not be checked (no `gh`, a source missing) in one line at the end.
