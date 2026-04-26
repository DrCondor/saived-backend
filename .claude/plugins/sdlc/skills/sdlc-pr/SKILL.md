---
name: sdlc-pr
description: Use AFTER sdlc:verification passes, to open a GitHub PR with a context-aware checklist. The checklist adapts to what the diff touched.
---

# SAIVED PR Creation

This skill opens a GitHub PR whose description includes a checklist tailored to the changes.

## Inputs

1. The current branch's diff against `main`: `git diff main...HEAD`
2. The active opsx proposal: `openspec/changes/<id>/proposal.md` (if present)
3. The Trello card ID: parsed from branch name (`feat/<slug>` → look up via trellosync) OR explicitly passed

## Algorithm

1. Run `git diff --name-only main...HEAD` to enumerate changed files.
2. Apply each rule from the conditional table (see "Heuristics" below) — append matching items.
3. Always include the BASE pre-merge and post-merge sections.
4. Compose the PR body and open with `gh pr create`.

## Heuristics

For each rule below, if its trigger condition matches the diff, append the listed checklist items to the **Pre-merge** section.

### Always present (regardless of diff)

- `[ ] Tests pass locally (\`bin/rails test\`)`
- `[ ] Rubocop clean (\`bin/rubocop\`)`
- `[ ] Brakeman clean (\`bin/brakeman -q\`)`
- `[ ] Spec & implementation match (read both side-by-side)`

### Conditional rules

| Trigger | Detection | Items to append |
|---|---|---|
| Migration | `git diff --name-only main...HEAD` matches `db/migrate/.*\.rb` | `[ ] Migration tested up & down on copy of prod data` <br> `[ ] Rollback plan documented in PR description` |
| API controller | matches `app/controllers/api/.*` | `[ ] No backward-incompatible API change OR version bumped` |
| View / front-end | matches `app/views/.*` OR `app/javascript/.*` | `[ ] Before/after screenshot in PR description` |
| Dependency | matches `Gemfile$|Gemfile\.lock$|package\.json$|yarn\.lock$` | `[ ] License of new dep verified` <br> `[ ] Brakeman re-run after Gemfile.lock change` |
| Routes | matches `config/routes\.rb` | `[ ] No new public route without auth check` |
| New model association | `git diff main...HEAD -- app/models/` contains `belongs_to|has_many|has_one|has_and_belongs_to_many` lines added | `[ ] N+1 verified (bullet log clean)` |
| New job class | new file under `app/jobs/.*\.rb` | `[ ] Idempotency confirmed` |
| Serializer | matches `app/serializers/.*` OR `app/views/api/.*\.jbuilder` | `[ ] No PII leak in serialized output` |
| External API call | grep added lines for `Net::HTTP\|Faraday\|HTTParty\|RestClient\|fetch\(` | `[ ] Retry strategy + circuit-breaker considered` |

### Always present (post-merge)

- `[ ] Fly.io deploy green (link to release)`
- `[ ] Production smoke test passed`
- `[ ] Logs sane 5 minutes post-deploy`
- `[ ] Rollback command verified: \`fly releases rollback v<N-1>\``

## Composition

1. Run `git diff --name-only main...HEAD` to enumerate files
2. Run `git diff main...HEAD` for line-level greps where needed
3. Apply each rule in order; deduplicate items
4. Compose body. Order: Trello → Spec → Pre-merge (base + conditional) → Post-merge

## Final command

```bash
gh pr create --title "<derived from card name or branch>" --body "$(cat <<'EOF'
<assembled body>
EOF
)"
```

Always print the final body to stdout BEFORE calling `gh pr create`, so the human can read it during the demo.
