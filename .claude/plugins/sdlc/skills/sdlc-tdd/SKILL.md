---
name: sdlc-tdd
description: Use BEFORE writing any implementation code. Enforces test-first discipline for SAIVED Rails (Minitest) and JS (Vitest/Jest).
---

# Test-First Development for SAIVED

Before any change to `app/**`, `lib/**`, `db/**`, or production JS:

## Protocol

1. **Identify the smallest unit of behaviour** that the upcoming change must add or alter.
2. **Write the failing test FIRST**, in the appropriate suite:
   - Rails models / services / jobs → `test/models/`, `test/services/`, `test/jobs/` using Minitest + FactoryBot
   - Rails controllers → `test/controllers/api/v1/` (or `admin/`)
   - System / integration → `test/system/` using Capybara
   - JS components → matching `*.test.tsx` next to the component (Vitest)
   - Extension JS → `saived-extension/test/` (Jest) — out of scope here
3. **Run the test** and CONFIRM it fails for the RIGHT reason (assertion failure, not setup failure).
   ```bash
   bin/rails test test/path/to/your_test.rb -n /test_name/
   ```
4. **Write the minimal code** to make the test pass. No more.
5. **Re-run**. Confirm pass.
6. **Refactor** under green tests.
7. **Run the full suite** before claiming done: `bin/rails test`.

## Hard rules

- A test that has never failed is not a test — re-running an unchanged test does not count
- Do NOT comment out, mark `pending`, or relax an assertion to make CI green
- One failing test at a time — do not stack 5 failures and try to fix them simultaneously
- If you cannot write a failing test (e.g., refactor with no behaviour change), say so explicitly and proceed without TDD; do NOT invent a meaningless test

## When TDD is NOT appropriate

- Pure refactor with zero behaviour change
- Generated code (scaffolds, migrations) where the framework guarantees correctness
- Documentation / config / build-script changes

State which case applies in your handoff if you skipped TDD.
