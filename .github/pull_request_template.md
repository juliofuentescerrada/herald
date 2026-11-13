## Change

OpenSpec change: `openspec/changes/<name>/`

<!-- What this pull request does, in a sentence or two. A slice's pull request closes its issue: Closes #… -->

## Test script

<!-- A slice: the steps the maintainer follows (persona, seeded data, what to do and expect) and a link to the run's `test-script-screens` artefact. Until M4 the round is local (`aspire run`); with M4, on the preview. Otherwise: not applicable. -->

## Review

<!-- The herald-reviewer's findings on `git diff main...HEAD`, and how each was resolved. -->

## Archive

<!-- The change is archived in this pull request: the specification sync, the roadmap row, every new scenario with its test. Or why not. -->

## Checklist

- [ ] ADR added, refined while Proposed, or superseded as appropriate; authorised consolidation noted
- [ ] `docs/roadmap.md`, `README.md` and agent conventions (`CLAUDE.md` files, `herald-*` skills, `openspec/config.yaml`) updated (if affected)
- [ ] Domain rules covered by tests that read as sentences
- [ ] Integration events: contract change is backwards compatible, or versioned
- [ ] Confirmed decisions, proposed defaults, historical evidence and implemented behaviour are distinguishable
- [ ] Affected visual references/states and feature dependency boundaries are recorded, or marked not applicable

<!-- End with `node scripts/harness-metrics.mjs --branch --markdown`. -->
