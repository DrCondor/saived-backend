# SAIVED AI Ecosystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-grade AI ecosystem described in `docs/superpowers/specs/2026-04-26-ai-ecosystem-design.md`: 5 specialised subagents, sdlc plugin port, trellosync plugin, Trello MCP server, dynamic PR checklists, GitHub Actions automation, hooks/guardrails, full docs.

**Architecture:** Five layers (guardrails → infra → plugins → subagents → orchestration) all living under `saived-backend/`. New code: `.claude/agents/`, `.claude/plugins/{sdlc,trellosync}/`, `.claude/hooks/`, `tooling/trello-mcp/`, `.github/workflows/{claude-review,trello-sync,deploy}.yml`. Doc updates: `CLAUDE.md`, `AGENTS.md`. Existing `.claude/commands/opsx/` and `.claude/skills/` (OpenSpec) untouched.

**Tech Stack:** Ruby on Rails 7.2 (existing), Node 20 + TypeScript + `@modelcontextprotocol/sdk` (Trello MCP), GitHub Actions (CI/CD), Anthropic Claude Code (agents), Bash (hooks).

---

## File Structure

Files to create or modify, grouped by responsibility:

**Subagents** (Stage 1)
- Create: `.claude/agents/architect.md`
- Create: `.claude/agents/implementer.md`
- Create: `.claude/agents/reviewer.md`
- Create: `.claude/agents/debugger.md`
- Create: `.claude/agents/qa-tester.md`

**sdlc plugin** (Stage 1, dynamic checklist deferred to Stage 4)
- Create: `.claude/plugins/sdlc/.claude-plugin/plugin.json`
- Create: `.claude/plugins/sdlc/skills/sdlc-tdd/SKILL.md`
- Create: `.claude/plugins/sdlc/skills/sdlc-pr/SKILL.md` (filled in Stage 4)
- Create: `.claude/plugins/sdlc/skills/sdlc-parallel/SKILL.md`
- Create: `.claude/plugins/sdlc/skills/sdlc-verification/SKILL.md`
- Create: `.claude/plugins/sdlc/skills/sdlc-retro/SKILL.md`
- Create: `.claude/plugins/sdlc/skills/sdlc-debug/SKILL.md`

**Hooks & settings** (Stage 1)
- Create: `.claude/hooks/pre_bash_guard.sh`
- Create: `.claude/hooks/audit_log.sh`
- Create: `.claude/logs/.gitkeep`
- Modify: `.claude/settings.json` (create if absent)
- Modify: `.gitignore` (ignore `.claude/logs/*.jsonl`)

**Trello MCP server** (Stage 2)
- Create: `tooling/trello-mcp/package.json`
- Create: `tooling/trello-mcp/tsconfig.json`
- Create: `tooling/trello-mcp/src/index.ts`
- Create: `tooling/trello-mcp/src/trello-client.ts`
- Create: `tooling/trello-mcp/src/tools.ts`
- Create: `tooling/trello-mcp/README.md`
- Create: `tooling/trello-mcp/.gitignore`
- Create: `.mcp.json` (project-scoped MCP config)

**trellosync plugin** (Stage 3)
- Create: `.claude/plugins/trellosync/.claude-plugin/plugin.json`
- Create: `.claude/plugins/trellosync/skills/trellosync-start/SKILL.md`
- Create: `.claude/plugins/trellosync/skills/trellosync-ship/SKILL.md`
- Create: `.claude/plugins/trellosync/skills/trellosync-backlog/SKILL.md`
- Create: `.claude/plugins/trellosync/skills/trellosync-comment/SKILL.md`

**GitHub Actions** (Stage 5)
- Create: `.github/workflows/claude-review.yml`
- Create: `.github/workflows/trello-sync.yml`
- Create: `.github/workflows/deploy.yml`

**Docs** (Stage 6)
- Modify: `CLAUDE.md` (append "AI Workflow" section)
- Create: `AGENTS.md` (Codex-parity instructions)
- Create: `.claude/plugins/sdlc/README.md`
- Create: `.claude/plugins/trellosync/README.md`

**Dry run** (Stage 7) — feature TBD, files determined when feature is picked.

---

## Stage 0: Branch & worktree setup

### Task 0.1: Feature branch

- [ ] **Step 1: Verify clean working tree**

Run: `git status --short`
Expected: only the (now committed) spec; other untracked artefacts (`.claude/`, `openspec/changes/extension-ux-overhaul/`) are pre-existing and ignored for this work.

- [ ] **Step 2: Create feature branch**

```bash
git checkout -b feat/ai-ecosystem
```

- [ ] **Step 3: Push the branch upstream**

```bash
git push -u origin feat/ai-ecosystem
```

---

## Stage 1: Foundation — subagents, sdlc plugin skeleton, hooks, settings

### Task 1.1: Create the five subagent files

**Files:**
- Create: `.claude/agents/architect.md`
- Create: `.claude/agents/implementer.md`
- Create: `.claude/agents/reviewer.md`
- Create: `.claude/agents/debugger.md`
- Create: `.claude/agents/qa-tester.md`

- [ ] **Step 1: Copy `architect.md` body verbatim from spec §3.1**

Source: `docs/superpowers/specs/2026-04-26-ai-ecosystem-design.md` → "#### `architect.md`" code block. Write its content (everything inside the `markdown` fence, starting from `---\nname: architect`) to `.claude/agents/architect.md`.

- [ ] **Step 2: Copy `implementer.md` body verbatim from spec §3.1**

Source: same spec, "#### `implementer.md`" block. Write to `.claude/agents/implementer.md`.

- [ ] **Step 3: Copy `reviewer.md` body verbatim from spec §3.1**

Write to `.claude/agents/reviewer.md`.

- [ ] **Step 4: Copy `debugger.md` body verbatim from spec §3.1**

Write to `.claude/agents/debugger.md`.

- [ ] **Step 5: Copy `qa-tester.md` body verbatim from spec §3.1**

Write to `.claude/agents/qa-tester.md`.

- [ ] **Step 6: Verify subagent files load**

Run: `ls -la .claude/agents/` — expect 5 .md files.
Open Claude Code in this dir, type `/agents` — expect all five listed.

- [ ] **Step 7: Commit**

```bash
git add .claude/agents/
git commit -m "feat(agents): add 5 specialised subagents (architect, implementer, reviewer, debugger, qa-tester)"
```

### Task 1.2: sdlc plugin manifest

**Files:**
- Create: `.claude/plugins/sdlc/.claude-plugin/plugin.json`

- [ ] **Step 1: Write plugin manifest**

Path: `.claude/plugins/sdlc/.claude-plugin/plugin.json`

```json
{
  "name": "sdlc",
  "version": "0.1.0",
  "description": "SAIVED SDLC workflow skills: TDD, PR with dynamic checklist, parallel agents, verification, retro, debug",
  "author": "Konrad Smolinski"
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/.claude-plugin/
git commit -m "feat(sdlc): plugin manifest"
```

### Task 1.3: `sdlc:tdd` skill

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-tdd/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-tdd/
git commit -m "feat(sdlc): tdd skill"
```

### Task 1.4: `sdlc:verification` skill

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-verification/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-verification/
git commit -m "feat(sdlc): verification skill"
```

### Task 1.5: `sdlc:pr` skill (placeholder, dynamic logic in Stage 4)

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-pr/SKILL.md`

- [ ] **Step 1: Write the skeleton (dynamic heuristics added in Task 4.1)**

```markdown
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

(Filled in Task 4.1 — see updated SKILL.md after Stage 4.)

## Base sections

```markdown
## Trello
Trello-Card: <CARD_ID>

## Spec
<link to openspec/changes/<id>/proposal.md or "n/a">

## Pre-merge (HUMAN MUST TICK)
- [ ] Tests pass locally (`bin/rails test`)
- [ ] Rubocop clean (`bin/rubocop`)
- [ ] Brakeman clean (`bin/brakeman -q`)
- [ ] Spec & implementation match (read both side-by-side)

## Post-merge (HUMAN MUST TICK after deploy)
- [ ] Fly.io deploy green (link to release)
- [ ] Production smoke test passed
- [ ] Logs sane 5 minutes post-deploy
- [ ] Rollback command verified: `fly releases rollback v<N-1>`
```
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-pr/
git commit -m "feat(sdlc): pr skill skeleton (heuristics added later)"
```

### Task 1.6: `sdlc:parallel` skill

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-parallel/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: sdlc-parallel
description: Use when an opsx proposal contains 2+ independent slices. Dispatches parallel implementer subagents in isolated git worktrees, then merges via reviewer.
---

# Parallel Implementation via Worktrees

## When to use

The active proposal explicitly lists 2 or more slices that:
- Touch different files (no shared writes)
- Have no ordering dependency
- Have independent test surfaces

If unsure, do NOT parallelise — sequential is safer.

## Protocol

For each slice `<S>` in the proposal:

1. **Create worktree** (one-time per slice):

   ```bash
   git worktree add ../saived-backend-<slug>-<S> -b feat/<slug>-<S> main
   ```

2. **Dispatch implementer agent** in that worktree, with the proposal section for `<S>` as input. Use the `Task` tool with `subagent_type: implementer`. Give it:
   - Path to the worktree
   - The slice section of the proposal
   - Instruction: "implement only this slice, do not touch other paths, run sdlc:tdd then sdlc:verification before claiming done"

3. **Wait** for all implementers to report back.

4. **Reviewer agent merges**: dispatch `reviewer` subagent. Its job:
   - Pull each slice branch into a temporary integration branch
   - Run full test suite on the integration
   - If clean, hand back to human; if conflicts, halt and report

5. **Cleanup**:

   ```bash
   git worktree remove ../saived-backend-<slug>-<S>
   ```

   Only run AFTER the integration branch is merged or discarded.

## Disposal protocol (failed slice)

```bash
git worktree remove --force ../saived-backend-<slug>-<S>
git branch -D feat/<slug>-<S>
```

The proposal slice is then re-attempted by a fresh implementer (or escalated to human).

## Hard rules

- Maximum 3 parallel slices in a single fan-out (cognitive limit for the human reviewer)
- Each slice MUST have its own test file(s); shared test files = shared state = not parallel
- Do NOT parallelise migrations; they sequence by timestamp and conflict
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-parallel/
git commit -m "feat(sdlc): parallel skill"
```

### Task 1.7: `sdlc:retro` skill

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-retro/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: sdlc-retro
description: Use after a notable session — successful feature ship, painful debug, agent failure. Captures lessons to docs/superpowers/retros/.
---

# SAIVED Session Retro

Short retros after significant sessions. Compounds over time into a real corpus of lessons.

## When to write a retro

- Agent went off-rails and you had to reset (record what triggered it)
- A test took >30 minutes to fix (record root cause)
- A subagent role mandate proved wrong (record the gap)
- A skill misfired (record so it gets patched)
- A feature shipped cleanly (record what worked — positive feedback matters)

## Format

File: `docs/superpowers/retros/YYYY-MM-DD-<short-topic>.md`

```markdown
# Retro: <topic>

**Date:** YYYY-MM-DD
**Session length:** Xh
**Outcome:** shipped | reverted | escalated | abandoned

## What happened
<2-3 sentences>

## What worked
- ...

## What didn't
- ...

## Root cause (if applicable)
<one paragraph>

## Action items
- [ ] Update CLAUDE.md section X to ...
- [ ] Patch skill Y to ...
- [ ] Add deny rule for Z

## Tags
#agent-failure #spec-drift #tooling #onboarding etc.
```

## Hard rules

- Retros are TERSE. 200 words max.
- Action items are concrete and assigned (to "next session" if no other owner).
- Never blame an agent — agents follow prompts; if the agent failed, the prompt failed.
- Never blame the human either.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-retro/
git commit -m "feat(sdlc): retro skill"
```

### Task 1.8: `sdlc:debug` skill

**Files:**
- Create: `.claude/plugins/sdlc/skills/sdlc-debug/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-debug/
git commit -m "feat(sdlc): debug skill"
```

### Task 1.9: PreToolUse bash guard hook

**Files:**
- Create: `.claude/hooks/pre_bash_guard.sh`

- [ ] **Step 1: Write the hook**

```bash
#!/usr/bin/env bash
# Pre-Bash guard: blocks destructive commands beyond what settings.json deny rules catch.
# Reads tool input as JSON on stdin, exits 0 to allow, 2 to block (with stderr message).

set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"

block() {
  >&2 echo "BLOCKED by pre_bash_guard: $1"
  exit 2
}

# Production-style destructive commands
case "$cmd" in
  *"rails db:reset"*|*"rake db:reset"*) block "rails db:reset" ;;
  *"rails db:drop"*|*"rake db:drop"*)   block "rails db:drop" ;;
  *"rails db:seed"*) [[ "${RAILS_ENV:-}" == "production" ]] && block "db:seed in production" ;;
  *"rm -rf /"*|*"rm -rf ~"*) block "rm -rf root/home" ;;
  *"git push --force"*"main"*) block "force-push to main" ;;
  *"git push -f "*"main"*)     block "force-push to main" ;;
  *"git reset --hard"*"origin/main"*) block "hard reset to origin/main (use revert)" ;;
  *"flyctl deploy --remote-only"*) ;;  # allowed
  *"flyctl deploy"*)
    [[ -z "${ALLOW_LOCAL_DEPLOY:-}" ]] && block "local fly deploy (use deploy.yml workflow)"
    ;;
esac

exit 0
```

- [ ] **Step 2: Make executable**

```bash
chmod +x .claude/hooks/pre_bash_guard.sh
```

- [ ] **Step 3: Smoke test the script**

```bash
echo '{"tool_input":{"command":"bin/rails test"}}' | .claude/hooks/pre_bash_guard.sh && echo "ALLOWED"
echo '{"tool_input":{"command":"bin/rails db:reset"}}' | .claude/hooks/pre_bash_guard.sh || echo "BLOCKED (expected)"
```

Expected: first prints `ALLOWED`, second prints `BLOCKED by pre_bash_guard: rails db:reset` and `BLOCKED (expected)`.

- [ ] **Step 4: Commit**

```bash
git add .claude/hooks/pre_bash_guard.sh
git commit -m "feat(hooks): pre_bash_guard for destructive commands"
```

### Task 1.10: PostToolUse audit log hook

**Files:**
- Create: `.claude/hooks/audit_log.sh`
- Create: `.claude/logs/.gitkeep`

- [ ] **Step 1: Write the hook**

```bash
#!/usr/bin/env bash
# PostToolUse audit log: append a JSONL row per tool call to .claude/logs/session-YYYY-MM-DD.jsonl
set -euo pipefail

input="$(cat)"
date_str="$(date +%Y-%m-%d)"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log_dir=".claude/logs"
log_file="$log_dir/session-$date_str.jsonl"

mkdir -p "$log_dir"

tool="$(printf '%s' "$input" | jq -r '.tool_name // "unknown"')"
status="$(printf '%s' "$input" | jq -r '.tool_response.status // "ok"')"

# Truncate large args to keep log compact
args="$(printf '%s' "$input" | jq -c '.tool_input | (tostring | .[0:500])')"

printf '{"ts":"%s","tool":"%s","status":"%s","args":%s}\n' "$ts" "$tool" "$status" "$args" >> "$log_file"

exit 0
```

- [ ] **Step 2: Make executable + create log dir keep file**

```bash
chmod +x .claude/hooks/audit_log.sh
mkdir -p .claude/logs
touch .claude/logs/.gitkeep
```

- [ ] **Step 3: Update `.gitignore`**

Append to `.gitignore`:

```
# Claude Code local audit logs (committed: .gitkeep only)
.claude/logs/*.jsonl
```

- [ ] **Step 4: Smoke test**

```bash
echo '{"tool_name":"Bash","tool_input":{"command":"ls"},"tool_response":{"status":"ok"}}' \
  | .claude/hooks/audit_log.sh
cat .claude/logs/session-*.jsonl | tail -1
```

Expected: a JSON line with `tool: "Bash"` and `status: "ok"`.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/audit_log.sh .claude/logs/.gitkeep .gitignore
git commit -m "feat(hooks): audit log for every tool call"
```

### Task 1.11: settings.json with permissions + hooks

**Files:**
- Create or modify: `.claude/settings.json`

- [ ] **Step 1: Check for existing settings**

Run: `ls .claude/settings*.json 2>/dev/null`. If `settings.local.json` exists, leave it alone; we are creating the project-shared `settings.json`.

- [ ] **Step 2: Write settings.json**

```json
{
  "permissions": {
    "allow": [
      "Bash(bin/rails test*)",
      "Bash(bin/rails routes*)",
      "Bash(bin/rails db:migrate*)",
      "Bash(bin/rails db:rollback*)",
      "Bash(bin/rubocop*)",
      "Bash(bin/brakeman*)",
      "Bash(bin/setup*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git checkout*)",
      "Bash(git branch*)",
      "Bash(git push*)",
      "Bash(git worktree*)",
      "Bash(gh pr*)",
      "Bash(gh run*)",
      "Bash(gh issue*)",
      "Bash(npm run*)",
      "Bash(npm install*)",
      "Bash(yarn*)",
      "Bash(node *)",
      "Bash(jq *)",
      "Bash(curl *)"
    ],
    "deny": [
      "Bash(bin/rails db:reset*)",
      "Bash(bin/rails db:drop*)",
      "Bash(rm -rf*)",
      "Bash(git push --force*main*)",
      "Bash(git push -f*main*)",
      "Read(.env*)",
      "Read(**/trello_credentials*)",
      "Read(**/.fly.toml.secrets)",
      "Read(**/*.pem)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/pre_bash_guard.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/audit_log.sh" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verify Claude Code parses it**

Restart Claude Code in this dir. If it warns about settings.json, fix the JSON. Run `/permissions` and confirm allow/deny rules are listed.

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.json
git commit -m "feat(settings): permissions + hooks for guardrails and audit"
```

---

## Stage 2: Trello MCP server

### Task 2.1: Initialize the MCP package

**Files:**
- Create: `tooling/trello-mcp/package.json`
- Create: `tooling/trello-mcp/tsconfig.json`
- Create: `tooling/trello-mcp/.gitignore`

- [ ] **Step 1: Create dir and package.json**

```bash
mkdir -p tooling/trello-mcp/src
```

`tooling/trello-mcp/package.json`:

```json
{
  "name": "saived-trello-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "smoke": "node dist/smoke.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: .gitignore**

`tooling/trello-mcp/.gitignore`:

```
node_modules/
dist/
*.log
```

- [ ] **Step 4: Install deps**

```bash
cd tooling/trello-mcp && npm install && cd -
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 5: Commit**

```bash
git add tooling/trello-mcp/package.json tooling/trello-mcp/tsconfig.json tooling/trello-mcp/.gitignore tooling/trello-mcp/package-lock.json
git commit -m "feat(trello-mcp): npm package skeleton"
```

### Task 2.2: Trello REST client

**Files:**
- Create: `tooling/trello-mcp/src/trello-client.ts`

- [ ] **Step 1: Write the client**

```typescript
const BASE = "https://api.trello.com/1";

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  url: string;
  due: string | null;
  idList: string;
  labels: { id: string; name: string; color: string }[];
}

export interface TrelloList {
  id: string;
  name: string;
}

export interface TrelloComment {
  id: string;
  text: string;
  date: string;
  author: string;
}

export class TrelloClient {
  private key: string;
  private token: string;
  private boardId: string;
  private listCache: Map<string, TrelloList> | null = null;

  constructor(key: string, token: string, boardId: string) {
    if (!key || !token || !boardId) {
      throw new Error("TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID required");
    }
    this.key = key;
    this.token = token;
    this.boardId = boardId;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("key", this.key);
    url.searchParams.set("token", this.token);

    let attempt = 0;
    let lastErr: unknown;
    while (attempt < 3) {
      try {
        const res = await fetch(url, init);
        if (res.status === 429) {
          await sleep(2000 * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        if (!res.ok) {
          throw new Error(`Trello ${res.status}: ${await res.text()}`);
        }
        return (await res.json()) as T;
      } catch (e) {
        lastErr = e;
        attempt++;
        await sleep(500 * attempt);
      }
    }
    throw lastErr;
  }

  async getLists(): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${this.boardId}/lists`);
  }

  private async listIdByName(name: string): Promise<string> {
    if (!this.listCache) {
      const lists = await this.getLists();
      this.listCache = new Map(lists.map((l) => [l.name, l]));
    }
    const list = this.listCache.get(name);
    if (!list) {
      throw new Error(`List "${name}" not found on board`);
    }
    return list.id;
  }

  async listCards(listName: string): Promise<TrelloCard[]> {
    const listId = await this.listIdByName(listName);
    return this.request<TrelloCard[]>(`/lists/${listId}/cards`);
  }

  async getCard(cardId: string): Promise<TrelloCard & { comments: TrelloComment[] }> {
    const card = await this.request<TrelloCard>(`/cards/${cardId}`);
    type Action = { id: string; date: string; data: { text?: string }; memberCreator: { fullName: string } };
    const actions = await this.request<Action[]>(
      `/cards/${cardId}/actions?filter=commentCard`,
    );
    const comments: TrelloComment[] = actions
      .filter((a) => a.data?.text)
      .map((a) => ({
        id: a.id,
        text: a.data.text!,
        date: a.date,
        author: a.memberCreator.fullName,
      }));
    return { ...card, comments };
  }

  async moveCard(cardId: string, targetListName: string): Promise<void> {
    const targetId = await this.listIdByName(targetListName);
    await this.request(`/cards/${cardId}?idList=${targetId}`, { method: "PUT" });
  }

  async commentCard(cardId: string, text: string): Promise<{ id: string }> {
    const r = await this.request<{ id: string }>(
      `/cards/${cardId}/actions/comments?text=${encodeURIComponent(text)}`,
      { method: "POST" },
    );
    return { id: r.id };
  }

  async getBoardSummary(): Promise<{ lists: { name: string; count: number }[] }> {
    const lists = await this.getLists();
    const counts = await Promise.all(
      lists.map(async (l) => {
        const cards = await this.request<TrelloCard[]>(`/lists/${l.id}/cards`);
        return { name: l.name, count: cards.length };
      }),
    );
    return { lists: counts };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
```

- [ ] **Step 2: Type-check**

```bash
cd tooling/trello-mcp && npx tsc --noEmit && cd -
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tooling/trello-mcp/src/trello-client.ts
git commit -m "feat(trello-mcp): REST client with retry/backoff"
```

### Task 2.3: MCP tool definitions

**Files:**
- Create: `tooling/trello-mcp/src/tools.ts`

- [ ] **Step 1: Write tool registrations**

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TrelloClient } from "./trello-client.js";

export function registerTools(server: McpServer, client: TrelloClient) {
  server.tool(
    "trello_list_cards",
    "List cards in a Trello list (by list name).",
    { list_name: z.string().describe("Name of the Trello list, e.g. 'To Do'") },
    async ({ list_name }) => {
      const cards = await client.listCards(list_name);
      const summary = cards.map((c) => ({
        id: c.id,
        name: c.name,
        url: c.url,
        labels: c.labels.map((l) => l.name),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.tool(
    "trello_get_card",
    "Get full details of a Trello card including comments.",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const card = await client.getCard(card_id);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    },
  );

  server.tool(
    "trello_move_card",
    "Move a Trello card to a different list (by list name).",
    {
      card_id: z.string(),
      target_list: z.string().describe("Name of target list, e.g. 'In Progress'"),
    },
    async ({ card_id, target_list }) => {
      await client.moveCard(card_id, target_list);
      return { content: [{ type: "text", text: `moved ${card_id} → ${target_list}` }] };
    },
  );

  server.tool(
    "trello_comment_card",
    "Post a comment on a Trello card.",
    { card_id: z.string(), text: z.string() },
    async ({ card_id, text }) => {
      const r = await client.commentCard(card_id, text);
      return { content: [{ type: "text", text: `comment ${r.id}` }] };
    },
  );

  server.tool(
    "trello_get_board",
    "Summary of the configured board: list names with card counts.",
    {},
    async () => {
      const s = await client.getBoardSummary();
      return { content: [{ type: "text", text: JSON.stringify(s, null, 2) }] };
    },
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd tooling/trello-mcp && npx tsc --noEmit && cd -
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tooling/trello-mcp/src/tools.ts
git commit -m "feat(trello-mcp): 5 MCP tools registered"
```

### Task 2.4: MCP server entry point

**Files:**
- Create: `tooling/trello-mcp/src/index.ts`

- [ ] **Step 1: Write the entry**

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TrelloClient } from "./trello-client.js";
import { registerTools } from "./tools.js";

async function main() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!key || !token || !boardId) {
    console.error("Missing TRELLO_KEY, TRELLO_TOKEN, or TRELLO_BOARD_ID env var.");
    process.exit(1);
  }

  const client = new TrelloClient(key, token, boardId);
  const server = new McpServer({
    name: "saived-trello",
    version: "0.1.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server runs until stdio closes.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Build**

```bash
cd tooling/trello-mcp && npm run build && cd -
```

Expected: `dist/index.js`, `dist/tools.js`, `dist/trello-client.js` produced.

- [ ] **Step 3: Smoke test the server starts (it will block on stdin)**

```bash
( cd tooling/trello-mcp && timeout 2 node dist/index.js < /dev/null ; ) ; echo "exit $?"
```

Expected: exits with 124 (timeout) — meaning the server started and was waiting for stdin. If it exits with 1 immediately, env vars are missing or build failed.

- [ ] **Step 4: Commit**

```bash
git add tooling/trello-mcp/src/index.ts
git commit -m "feat(trello-mcp): server entry point"
```

### Task 2.5: `.mcp.json` for project-scoped MCP config

**Files:**
- Create: `.mcp.json`

- [ ] **Step 1: Write project MCP config**

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["./tooling/trello-mcp/dist/index.js"],
      "env": {
        "TRELLO_KEY": "${TRELLO_KEY}",
        "TRELLO_TOKEN": "${TRELLO_TOKEN}",
        "TRELLO_BOARD_ID": "6963562a6d9c4475295fc205"
      }
    }
  }
}
```

- [ ] **Step 2: Verify TRELLO_KEY/TOKEN are sourced into shell**

```bash
echo "${TRELLO_KEY:-MISSING}" | head -c 4 ; echo
echo "${TRELLO_TOKEN:-MISSING}" | head -c 4 ; echo
```

Expected: 4-char prefixes, NOT "MISS". If missing, `source ~/.trello_credentials` and re-test.

- [ ] **Step 3: Restart Claude Code, approve the MCP server**

Restart in this directory. Claude Code prompts to approve the new MCP server. Approve.

- [ ] **Step 4: Verify MCP tools are available**

In Claude Code, type `/mcp` and confirm `trello` server is listed with 5 tools.

- [ ] **Step 5: End-to-end MCP smoke test**

In Claude Code session:

> "Use the trello_get_board tool to show me the board summary."

Expected: agent invokes tool, returns JSON with list names and counts including "To Do", "In Progress", "W testach (Marti)", "Done", "Sugestie".

- [ ] **Step 6: Commit**

```bash
git add .mcp.json
git commit -m "feat(mcp): project-scoped trello server"
```

---

## Stage 3: trellosync plugin

### Task 3.1: Plugin manifest

**Files:**
- Create: `.claude/plugins/trellosync/.claude-plugin/plugin.json`

- [ ] **Step 1: Write manifest**

```json
{
  "name": "trellosync",
  "version": "0.1.0",
  "description": "Trello ↔ git/opsx synchronization skills for SAIVED",
  "author": "Konrad Smolinski"
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/trellosync/.claude-plugin/
git commit -m "feat(trellosync): plugin manifest"
```

### Task 3.2: `trellosync:start`

**Files:**
- Create: `.claude/plugins/trellosync/skills/trellosync-start/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: trellosync-start
description: Use when starting work on a Trello card. Pulls card, creates branch, scaffolds opsx change, moves card to In Progress.
---

# Start Work on a Trello Card

## Inputs
- `<CARD_ID>` — Trello card short ID (e.g. `abc123XY`) OR full URL

## Protocol

### 1. Validate card exists

Call MCP tool: `trello_get_card(card_id)`. If not found, halt with the Trello error verbatim.

### 2. Derive a slug

From the card name, lowercase, kebab-case, max 40 chars, alphanumeric + `-`.

Example: "Dashboard total project value" → `dashboard-total-project-value`.

### 3. Verify branch state

```bash
git status --short
```

If working tree is dirty, halt with: "Working tree dirty — commit or stash first."

```bash
git fetch origin
git checkout main
git pull --ff-only
```

### 4. Create the feature branch

```bash
git checkout -b feat/<slug>
```

If branch already exists, ask the user before overwriting.

### 5. Scaffold the opsx change

Run `/opsx:new` with the card name as the change name. The opsx skill creates `openspec/changes/<id>/`.

Then write the card description into `openspec/changes/<id>/source-trello.md`:

```markdown
# Trello source

**Card:** <card_id>
**Title:** <card.name>
**URL:** <card.url>
**List:** <card.idList → resolved to name>

## Description

<card.desc>

## Comments

<for each comment in card.comments:>
**<author>** (<date>):
<text>

---
```

### 6. Move card to "In Progress"

Call MCP tool: `trello_move_card(card_id, "In Progress")`.

### 7. Comment back on card

Call MCP tool: `trello_comment_card(card_id, "🤖 Started on branch `feat/<slug>`")`.

### 8. Hand off to architect

State: "Card pulled. Branch `feat/<slug>` created. opsx scaffold at `openspec/changes/<id>/`. Hand off to **architect** subagent for /opsx:explore + /opsx:propose."

## Failure modes

| Failure | Action |
|---|---|
| Card not found | halt, surface error |
| Branch dirty | halt, ask human |
| Branch already exists | ask before reuse |
| MCP tool error | retry once, then halt |
| Trello rate limit | client handles with backoff; if still failing, halt |
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/trellosync/skills/trellosync-start/
git commit -m "feat(trellosync): start skill"
```

### Task 3.3: `trellosync:ship`

**Files:**
- Create: `.claude/plugins/trellosync/skills/trellosync-ship/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: trellosync-ship
description: Use AFTER opening a PR for a feature branch. Posts PR link to Trello card and moves card to "W testach (Marti)".
---

# Ship: Hand Off Card to QA

## Preconditions
- Open PR exists for current branch
- PR body contains `Trello-Card: <card_id>` line

## Protocol

### 1. Read PR

```bash
gh pr view --json number,url,title,body
```

If no PR: halt with "Open a PR first via /sdlc:pr."

### 2. Extract card ID

Regex `Trello-Card:\s*([A-Za-z0-9]+)` against PR body.

If not found: halt with "PR body missing `Trello-Card:` line — fix before shipping."

### 3. Comment on Trello

Call MCP tool: `trello_comment_card(card_id, "🚀 PR ready for QA: <pr.url>")`.

### 4. Move card

Call MCP tool: `trello_move_card(card_id, "W testach (Marti)")`.

### 5. Confirm

State: "Card moved to W testach (Marti). PR <pr.url>."
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/trellosync/skills/trellosync-ship/
git commit -m "feat(trellosync): ship skill"
```

### Task 3.4: `trellosync:backlog`

**Files:**
- Create: `.claude/plugins/trellosync/skills/trellosync-backlog/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: trellosync-backlog
description: Use to see what's in "To Do". Returns a markdown table of cards.
---

# Show Backlog

## Protocol

### 1. List cards

Call MCP tool: `trello_list_cards("To Do")`.

### 2. Render as markdown table

```markdown
| ID | Title | Labels |
|---|---|---|
| <card.id[0:8]> | <card.name> | <card.labels.join(", ")> |
| ... |
```

### 3. Hint next step

After the table, append: "Run `/trellosync:start <ID>` on any card."
```

- [ ] **Step 2: Commit**

```bash
git add .claude/plugins/trellosync/skills/trellosync-backlog/
git commit -m "feat(trellosync): backlog skill"
```

### Task 3.5: `trellosync:comment`

**Files:**
- Create: `.claude/plugins/trellosync/skills/trellosync-comment/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: trellosync-comment
description: Use to post a comment on a Trello card. Used by other agents (e.g. architect when card is ambiguous).
---

# Post Comment on Card

## Inputs
- `<CARD_ID>`
- `<TEXT>` — markdown allowed

## Protocol

Call MCP tool: `trello_comment_card(card_id, text)`.

Confirm with the comment ID returned.
```

- [ ] **Step 2: End-to-end smoke (use a real test card)**

```bash
# in Claude Code session, on a disposable test card:
# /trellosync:backlog
# /trellosync:start <test_card_id>
```

Expected: branch created, opsx scaffold present, card moved to "In Progress" on Trello board, comment with branch name visible on card.

- [ ] **Step 3: Commit**

```bash
git add .claude/plugins/trellosync/skills/trellosync-comment/
git commit -m "feat(trellosync): comment skill"
```

---

## Stage 4: Dynamic PR checklist heuristics

### Task 4.1: Update `sdlc:pr` with full heuristic table

**Files:**
- Modify: `.claude/plugins/sdlc/skills/sdlc-pr/SKILL.md`

- [ ] **Step 1: Replace the placeholder Heuristics section with the full table**

Replace the `## Heuristics` section (currently a placeholder) with:

```markdown
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
```

- [ ] **Step 2: Manual heuristic test**

In Claude Code session:

> "Use sdlc:pr to compose (but NOT open) a PR body for a synthetic diff that touches `db/migrate/20260426_add_total.rb`, `app/controllers/api/v1/dashboard_controller.rb`, and `app/javascript/components/DashboardTotals.tsx`. Show the body."

Expected: output contains migration items, API backward-compat item, screenshot item, all base items.

- [ ] **Step 3: Commit**

```bash
git add .claude/plugins/sdlc/skills/sdlc-pr/SKILL.md
git commit -m "feat(sdlc): dynamic PR checklist heuristics (9 conditional rules)"
```

---

## Stage 5: GitHub Actions

### Task 5.1: `claude-review.yml`

**Files:**
- Create: `.github/workflows/claude-review.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Claude Review

on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  review:
    if: |
      github.event.issue.pull_request != null &&
      contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          mode: pr-review
```

- [ ] **Step 2: Add the secret in GitHub**

(Manual step) Settings → Secrets → Actions → `New repository secret`:
- Name: `ANTHROPIC_API_KEY`
- Value: from Anthropic Console

Document this in the workflow file as a top comment so the next dev knows.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/claude-review.yml
git commit -m "feat(ci): claude-review workflow on @claude comment"
```

### Task 5.2: `trello-sync.yml`

**Files:**
- Create: `.github/workflows/trello-sync.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Trello sync on merge

on:
  pull_request:
    types: [closed]

permissions:
  pull-requests: read

jobs:
  sync:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    env:
      TRELLO_KEY: ${{ secrets.TRELLO_KEY }}
      TRELLO_TOKEN: ${{ secrets.TRELLO_TOKEN }}
      TRELLO_DONE_LIST_ID: ${{ vars.TRELLO_DONE_LIST_ID }}
    steps:
      - name: Extract Trello card ID
        id: extract
        run: |
          body="${{ github.event.pull_request.body }}"
          card_id=$(printf '%s' "$body" | grep -oE 'Trello-Card:[[:space:]]*[A-Za-z0-9]+' | head -1 | awk '{print $2}')
          if [ -z "$card_id" ]; then
            echo "No Trello-Card line in PR body — skipping."
            echo "card_id=" >> "$GITHUB_OUTPUT"
            exit 0
          fi
          echo "card_id=$card_id" >> "$GITHUB_OUTPUT"

      - name: Move card to Done
        if: steps.extract.outputs.card_id != ''
        run: |
          curl -fsSL -X PUT "https://api.trello.com/1/cards/${{ steps.extract.outputs.card_id }}?idList=${TRELLO_DONE_LIST_ID}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}"

      - name: Post merge comment
        if: steps.extract.outputs.card_id != ''
        run: |
          msg="✅ Merged: ${{ github.event.pull_request.html_url }} (commit ${{ github.event.pull_request.merge_commit_sha }})"
          curl -fsSL -X POST "https://api.trello.com/1/cards/${{ steps.extract.outputs.card_id }}/actions/comments?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" \
            --data-urlencode "text=${msg}"
```

- [ ] **Step 2: Configure secrets and vars**

(Manual)
- Secret `TRELLO_KEY` — Trello API key
- Secret `TRELLO_TOKEN` — Trello API token
- Variable `TRELLO_DONE_LIST_ID` — the list ID for "Done" (find via `trello_get_board` tool, or curl `/boards/<board_id>/lists`)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/trello-sync.yml
git commit -m "feat(ci): trello-sync moves card to Done on PR merge"
```

### Task 5.3: `deploy.yml`

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

- [ ] **Step 2: Add secret**

(Manual) Settings → Secrets → Actions → `FLY_API_TOKEN`. Generate via `flyctl auth token` locally.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(ci): auto-deploy to fly.io on main"
```

---

## Stage 6: Documentation

### Task 6.1: AI Workflow section in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append a new "## AI-driven workflow" section at the end of the file**

Content to append:

```markdown
## AI-driven workflow

This repo uses Claude Code as the primary code-production mechanism. The setup is documented in detail in `docs/superpowers/specs/2026-04-26-ai-ecosystem-design.md`. Quick reference:

### Subagents (`.claude/agents/`)
- `architect` (opus) — writes opsx specs, never code
- `implementer` (sonnet) — writes code under TDD, never specs
- `reviewer` (opus) — read-only PR review via `gh`
- `debugger` (sonnet) — invoked on stuck/failing tests, systematic methodology
- `qa-tester` (sonnet) — adds tests, never edits prod code

### Plugins
- `opsx` — OpenSpec workflow (existing)
- `sdlc` — TDD, PR (with dynamic checklist), parallel, verification, retro, debug
- `trellosync` — start, ship, backlog, comment

### MCP servers
- `trello` — `tooling/trello-mcp/`, project-scoped via `.mcp.json`. Requires `TRELLO_KEY` and `TRELLO_TOKEN` in shell env (sourced from `~/.trello_credentials`).

### Workflow

1. `/trellosync:backlog` → see "To Do"
2. `/trellosync:start <CARD_ID>` → branch + opsx scaffold + card moved
3. **architect** → /opsx:explore + /opsx:propose → human reviews proposal (Gate 1)
4. **implementer** → /sdlc:tdd + /opsx:apply → human reviews diff (Gate 2)
5. /sdlc:verification → all gates green
6. /sdlc:pr → PR with dynamic checklist
7. **reviewer** triggered via `@claude` PR comment
8. Human ticks pre-merge checklist + merges (Gate 3)
9. CI: trello-sync.yml moves card to Done; deploy.yml ships to Fly.io
10. Human ticks post-merge checklist (Gate 4)
11. /opsx:archive + optional /sdlc:retro

### Guardrails

- `.claude/settings.json` — allow/deny permissions
- `.claude/hooks/pre_bash_guard.sh` — blocks destructive commands
- `.claude/hooks/audit_log.sh` — every tool call logged to `.claude/logs/`

### Onboarding

Run `/opsx:onboard` for a guided walkthrough. Read this section, then read the design spec.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document ai-driven workflow"
```

### Task 6.2: AGENTS.md (Codex parity)

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write file**

```markdown
# AGENTS.md (Codex / non-Claude agents)

This file provides Codex-compatible instructions that mirror the Claude Code workflow described in `CLAUDE.md` § "AI-driven workflow".

## Equivalences

| Claude Code | Codex / generic agent |
|---|---|
| Subagents in `.claude/agents/` | Use the role definitions verbatim as system prompts; switch agents per task |
| Skills in `.claude/plugins/<name>/skills/` | Import these markdown files as tool/skill prompts |
| Slash commands `/opsx:*`, `/sdlc:*`, `/trellosync:*` | Invoke the corresponding skill body manually |
| `.mcp.json` | Configure equivalent MCP host (e.g. Codex MCP support) |
| Hooks in `.claude/hooks/` | Translate to your agent platform's pre/post hooks; or run them as wrapper scripts |

## Workflow

Identical to CLAUDE.md § "AI-driven workflow". Same gates, same guardrails. The only difference is invocation syntax.

## Differences worth knowing

- Codex does not natively support multi-agent worktree fan-out (`sdlc:parallel`). Sequence implementer slices serially when working in Codex.
- Codex permission model differs; replicate `.claude/settings.json` deny rules at the OS / git-hook level.
- Audit logging in `.claude/logs/` is Claude-Code specific; use Codex's built-in transcript export instead.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md for codex parity"
```

### Task 6.3: Plugin READMEs

**Files:**
- Create: `.claude/plugins/sdlc/README.md`
- Create: `.claude/plugins/trellosync/README.md`
- Create: `tooling/trello-mcp/README.md`

- [ ] **Step 1: sdlc README**

```markdown
# sdlc plugin

SAIVED SDLC workflow skills.

## Skills

- `sdlc:tdd` — write failing test first
- `sdlc:pr` — open GH PR with diff-aware checklist
- `sdlc:parallel` — fan out to N implementer subagents in worktrees
- `sdlc:verification` — run rails test + rubocop + brakeman
- `sdlc:retro` — log session insights to `docs/superpowers/retros/`
- `sdlc:debug` — systematic debugging with Rails recipes

## Authoring conventions

Skills live in `skills/<name>/SKILL.md`. Frontmatter requires `name` and `description`.
```

- [ ] **Step 2: trellosync README**

```markdown
# trellosync plugin

Trello ↔ git/opsx synchronization.

## Skills

- `trellosync:start <CARD_ID>` — pull card, branch, opsx scaffold, move card
- `trellosync:ship` — comment + move card after PR opened
- `trellosync:backlog` — list "To Do" as markdown table
- `trellosync:comment <CARD_ID> <TEXT>` — post comment

## Dependencies

Trello MCP server in `tooling/trello-mcp/`. See `.mcp.json` for config.

## Required env

- `TRELLO_KEY`
- `TRELLO_TOKEN`
- (board ID hard-coded in `.mcp.json`)
```

- [ ] **Step 3: trello-mcp README**

```markdown
# saived-trello-mcp

A minimal MCP server exposing Trello board operations.

## Tools

| Tool | Purpose |
|---|---|
| `trello_list_cards` | list cards in a list (by name) |
| `trello_get_card` | full card with comments |
| `trello_move_card` | move card to a different list |
| `trello_comment_card` | post comment |
| `trello_get_board` | summary (lists + counts) |

## Build

```bash
npm install
npm run build
```

Binary lands at `dist/index.js`. Wired into Claude Code via top-level `.mcp.json`.

## Env vars

- `TRELLO_KEY` (required)
- `TRELLO_TOKEN` (required)
- `TRELLO_BOARD_ID` (required; SAIVED's is `6963562a6d9c4475295fc205`)

Sourced from `~/.trello_credentials` in your shell rc.

## Auth

Uses Trello's `key + token` query-string auth. Token must have read+write on the board.
```

- [ ] **Step 4: Commit**

```bash
git add .claude/plugins/sdlc/README.md .claude/plugins/trellosync/README.md tooling/trello-mcp/README.md
git commit -m "docs: plugin and MCP READMEs"
```

---

## Stage 7: End-to-end dry run

### Task 7.1: Pick the demo feature

- [ ] **Step 1: Decide on the feature**

User to confirm. Default candidate from spec §11: **"Dashboard widget: total project value"** — backend + frontend slice, parallel-friendly, visual.

- [ ] **Step 2: Create the Trello card**

In Trello "To Do" list, create a card with title and description per spec §11 / brainstorm Section 2A. Note the card ID.

### Task 7.2: Full end-to-end dry run

(No new files; this stage exercises everything built so far on a real flow.)

- [ ] **Step 1: `/trellosync:backlog`**

Expected: card from 7.1 listed.

- [ ] **Step 2: `/trellosync:start <CARD_ID>`**

Expected: branch `feat/dashboard-...` exists, opsx scaffold, card moved to "In Progress", comment on card.

- [ ] **Step 3: Architect: `/opsx:explore` + `/opsx:propose`**

Expected: proposal.md present, lists ≥2 alternatives, marks parallel-friendly slices.

- [ ] **Step 4: Human review of proposal (Gate 1)**

Read it. Edit if needed. Confirm.

- [ ] **Step 5: `/sdlc:parallel` (if proposal supports it) OR sequential implementer**

Expected: implementations across the slices. Each slice green on its own.

- [ ] **Step 6: Human review of diff (Gate 2)**

- [ ] **Step 7: `/sdlc:verification`**

Expected: rails test + rubocop + brakeman all green.

- [ ] **Step 8: `/sdlc:pr`**

Expected: PR opened. Body contains conditional items matching the diff (e.g. screenshot if frontend touched, N+1 if model relations added).

- [ ] **Step 9: Comment `@claude please review`**

Expected: claude-review.yml triggers, posts review comments.

- [ ] **Step 10: Human ticks pre-merge checklist (Gate 3) + merge**

Expected: trello-sync.yml fires → card moves to "Done" + merge comment posted.
Expected: deploy.yml fires → fly deploy succeeds.

- [ ] **Step 11: Human ticks post-merge checklist (Gate 4)**

- [ ] **Step 12: `/opsx:archive`**

- [ ] **Step 13: Optional `/sdlc:retro`**

If the dry run had any rough edges, log them so they're fixed before recording the Loom.

- [ ] **Step 14: Commit any stragglers (CLAUDE.md updates from retro, etc.)**

```bash
git add -A
git commit -m "chore: dry run cleanup"
```

---

## Out of scope for this plan

The following items from the spec are intentionally excluded from this implementation plan and are tracked separately:

- Loom recording itself (Stage 8 in spec — narrative outline + actual recording)
- Demo feature implementation (the dry run exercises the *workflow* on the feature; the *feature code* is whatever the agents produce)
- Monorepo conversion (saived-extension stays separate)
- Sidekiq Trello pollers
- Custom statusline / output-style

---

## Self-review notes (already applied inline)

- Spec coverage: every spec section has at least one task except §7 (failure recovery — intentionally organic, no build artifact) and §11 (open questions — TBD by definition)
- Placeholder scan: clean (the "TBD" in Stage 7.1 is a structural gate, not a missing detail)
- Type consistency: tool names match across `tools.ts`, MCP config, and skill bodies (`trello_get_card`, `trello_move_card`, etc.)
- Frontmatter format for skills: SKILL.md with `name` + `description` — consistent across all 10 new skills
- Hook config in settings.json uses the correct nested `hooks` array per Claude Code schema

---

*End of plan.*
