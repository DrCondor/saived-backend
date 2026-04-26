---
name: sdlc-verification
description: Use BEFORE opening a PR or claiming a task done. Runs all SAIVED quality gates and reports results.
---

# SAIVED Pre-PR Verification

Run every gate, report each result. Do NOT skip a step because "it's just a small change".

## Required gates

### 1. Rails test suite

```bash
bin/rails test
```

Expect: `0 failures, 0 errors`. Skips are acceptable only if pre-existing.

### 2. Rubocop

```bash
bin/rubocop
```

Expect: `no offenses detected`. Auto-correct (`-A`) is acceptable for layout/safe cops only — never for `Lint/*` or `Security/*`.

### 3. Brakeman

```bash
bin/brakeman -q -A
```

Expect: `No warnings found`. Any new warning blocks the PR until justified inline with `# brakeman:safe-by-...` reasoning.

### 4. JavaScript / React tests (if `app/javascript/**` was touched)

```bash
yarn test --run
```

Expect: all suites pass.

## Optional but recommended

### 5. N+1 detection (if you touched ActiveRecord queries)

Run the relevant request in dev with `BULLET_DETECT=1`. Tail `log/bullet.log` for new warnings.

### 6. System tests (if you touched UI flow)

```bash
bin/rails test:system
```

## Reporting format

After running, post a summary as plain text:

```
sdlc:verification
- rails test: PASS (224 runs, 0 fail)
- rubocop:    PASS
- brakeman:   PASS (0 new)
- yarn test:  N/A (no JS changes)
- bullet:     N/A
- system:     N/A
```

Failures must be reported VERBATIM with the offending file:line.
