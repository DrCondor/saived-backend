---
name: sdlc-debug
description: Use when a test is failing, an agent is in a loop, or something is "weird". Imposes systematic-debugging methodology with SAIVED-specific recipes.
---

# Systematic Debugging for SAIVED

Adapted from superpowers:systematic-debugging. The methodology is universal; the recipes are Rails-specific.

## Methodology

1. **State the symptom precisely.** Copy the failing assertion, error message, or unexpected output VERBATIM. No paraphrasing.
2. **Form ≤3 hypotheses, ranked by prior probability.** Examples:
   - "Test factory is producing invalid data"
   - "Time-zone mismatch between test and assertion"
   - "Strong params filter is dropping the field"
3. **Design the smallest experiment** that distinguishes them. Examples:
   - Print the factory output
   - Run the test with `Time.zone = 'Europe/Warsaw'` explicit
   - Log the params at controller entry
4. **Run it.** Look at output. Narrow hypotheses.
5. **Repeat** until exactly one hypothesis remains.
6. **Fix only that.** No drive-by changes.
7. **Re-run full suite** to confirm no regression.

## Hard rules

- NEVER make a test pass by changing the assertion to match wrong output
- NEVER skip a test because "it's flaky" — flaky tests have causes; find them
- NEVER add `Thread.sleep` / `wait` to "fix" a race — fix the race
- After 3 dead-end hypotheses in a row: HALT. Hand off to human with the full hypothesis log.

## SAIVED-specific recipes

### Failing model spec — likely causes
- Factory invariants (check `test/factories/`)
- Validation order (Rails runs `before_validation` before `validate`)
- Polymorphic relation expecting wrong class

### Failing controller spec — likely causes
- Missing `sign_in user` (Devise)
- CSRF in JSON requests (use `as: :json`)
- Strong params silently dropping a key

### Flaky system test — likely causes
- Capybara wait time too short for an async fetch
- Time-zone difference between server and assertion
- Database fixture leakage between tests

### Slow test (>5s) — likely causes
- Real network call (mock with `WebMock`)
- Loading full fixtures when factory would do
- Eager-loading whole association tree
