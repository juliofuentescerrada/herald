---
name: herald-cleanup
description: Clean up Herald's local and remote branches, the agents' worktrees and the GitHub issues left without an update. Use when the maintainer asks to tidy branches, prune worktrees or close stale issues. It lists everything first and acts only after one confirmation.
---

# Herald cleanup

Two steps: a list with the evidence for each item, then, after the maintainer confirms it once, the actions. Nothing is deleted, closed or relabelled before that confirmation.

## Gather

Run in parallel:

- `git fetch --prune origin`, `git status -sb`, `git worktree list`
- `git branch --format='%(refname:short) %(upstream:short) %(upstream:track)'`
- `git branch --merged origin/main` and `git branch -r --merged origin/main`
- `gh pr list --state open --json number,headRefName` and `gh pr list --state all --limit 100 --json number,headRefName,state,mergedAt`
- `gh issue list --state open --limit 100 --json number,title,labels,milestone,updatedAt`; for a batch, its sub-issues' state (`gh api repos/{owner}/{repo}/issues/<n>/sub_issues --jq '.[]|"\(.number) \(.state)"'`)

## Classify

**Branches**, with the evidence for each:

| Item | Proposed action |
|---|---|
| Local branch merged into `origin/main`, or whose upstream is `[gone]` and whose pull request was merged | Delete (`git branch -d`; `-D` only when the merged pull request proves its commits are on `main`, as after a squash) |
| Remote branch merged into `origin/main`, or whose pull request was merged or closed | Delete (`git push origin --delete`) |
| Worktree of an agent (`.claude/worktrees/`, `worktree-agent-*`) without uncommitted changes, and its branch merged or with no commits beyond `origin/main` | Remove (`git worktree remove`) and delete its branch |
| `main` behind `origin/main` | Fast-forward (`git fetch origin main:main`, or `git pull --ff-only` on `main`) |

Never in the list, only reported for the maintainer to decide one by one: the current branch, a branch with an open pull request, a branch or worktree with commits on no remote or with uncommitted changes, and a branch without an upstream (show `git log --oneline origin/main..<branch>`).

**Issues** (labels as `docs/operations/delivery-tracking.md` defines them):

| Item | Proposed action |
|---|---|
| A batch all of whose slice sub-issues are closed | Close, commenting that its slices are merged |
| A slice whose pull request is merged | Close, linking the pull request |
| A status label that contradicts its pull request: `in-progress` with a ready pull request, `ready-to-test` with a draft, any status on a closed issue | Correct the label |
| A status label (`in-progress`, `ready-to-test`, `feedback`) with no activity on the issue or its pull request in 7 days | Ask: it waits for someone |
| An open issue without labels or milestone | Report only |

Issues labelled `idea`, and any rule the decision register (`docs/herald-functional-discovery.md` §15) does not settle, are never closed by this skill.

## Confirm and act

Show one numbered list in the maintainer's language: branches, worktrees and issues, each with its evidence and action, and the items reported only. Ask for one confirmation of the whole list; the maintainer may exclude items by number. Then apply the confirmed actions, each issue closed with a comment of one line giving the reason, and report what was done and anything that failed. Do not retry a failed deletion with force.
