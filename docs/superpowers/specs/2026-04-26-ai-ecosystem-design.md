# SAIVED AI Ecosystem — Design Spec

**Date:** 2026-04-26
**Status:** Draft (awaiting user review)
**Purpose:** Build a production-grade, end-to-end AI-driven development ecosystem on top of `saived-backend`, suitable as both (a) a real working setup for SAIVED development and (b) a demo for the MailMetrics AI Agent Engineer recruitment Loom (10–15 min).

---

## 1. Context & Goals

`saived-backend` is a Rails 7.2 / Postgres / Fly.io MVP (~11.4K LOC, 224 tests, real users). It already has:

- `.claude/commands/opsx/` — 10 OpenSpec workflow commands
- `.claude/skills/` — 10 OpenSpec skills (mirroring commands)
- Rich `CLAUDE.md` (6,300 lines) covering stack, models, Trello workflow, deploy
- CI: Brakeman + Rubocop + Minitest + Codecov
- Manual Trello workflow (board `6963562a6d9c4475295fc205`, credentials in `~/.trello_credentials`)

It does NOT yet have:

- A multi-agent role system (specialised subagents)
- Automated Trello ↔ GitHub sync
- A Claude-driven PR review pipeline
- A dynamic, context-aware PR verification checklist
- Codified "agentic" guardrails (hooks, deny rules, audit logging)
- Onboarding material for a developer joining mid-project

**Goal:** ship all of the above as a coherent, production-ready ecosystem. The design must answer every question in the recruitment brief (`Zadanie rekrutacyjne - AI Agent Engineer.pdf`):

| Brief question | Where addressed |
|---|---|
| 1.1 Stack & tools | §3, §10 |
| 1.2 Repo, CI/CD, tests, deployment | §3.6, §3.7 |
| 1.3 Models, tools, guardrails | §3.1, §3.5, §3.7 |
| 1.4 Workflow: requirement → merged PR | §4 |
| 1.5 Multi-agent orchestration | §3.1, §3.3 (parallel skill), §4 |
| 2.1 Defining requirements for agents | §4 (opsx flow), §6 |
| 2.2 What agent does alone vs. needs human | §4 (named gates) |
| 2.3 Review, testing, merge | §3.3 (sdlc:pr dynamic checklist), §3.6, §5 |
| 2.4 What when agent gets stuck | §7 (organic in demo narrative) |
| 3.1 Onboarding new dev | §8 |
| 3.2 Materials / docs / processes | §8, CLAUDE.md updates |
| 3.3 New person assigning / reviewing / debugging | §8 |
| 3.4 What can go wrong + prevention | §7, §8 |

---

## 2. Architecture (5 layers)

```
┌──────────────────────────────────────────────────────────────────┐
│  5. ORCHESTRATION                                                 │
│     - /ticket <CARD_ID>: sequential orchestrator with gates       │
│     - sdlc:parallel: fan-out for independent slices (worktrees)   │
├──────────────────────────────────────────────────────────────────┤
│  4. SUBAGENTS  (.claude/agents/*.md)                              │
│     architect | implementer | reviewer | debugger | qa-tester     │
├──────────────────────────────────────────────────────────────────┤
│  3. PLUGINS  (.claude/plugins/<name>/skills/*.md)                 │
│     opsx (existing)                                               │
│     sdlc  — port from Terro: tdd, pr, parallel, verification,     │
│             retro, debug                                          │
│     trellosync — NEW: start, ship, comment, backlog               │
├──────────────────────────────────────────────────────────────────┤
│  2. INFRASTRUCTURE                                                │
│     Trello MCP server (Node/TS, project-scoped via .mcp.json)     │
│     GitHub Actions: ci.yml (existing) +                           │
│                     claude-review.yml, trello-sync.yml,           │
│                     deploy.yml (NEW)                              │
│     Fly.io deploy target                                          │
├──────────────────────────────────────────────────────────────────┤
│  1. GUARDRAILS                                                    │
│     settings.json: allow/deny permissions                         │
│     PreToolUse hooks: block destructive ops, secret reads         │
│     PostToolUse hook: append session audit log                    │
│     PR template via sdlc:pr: dynamic checklist (§5)               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Component specs

### 3.1 Subagents (`.claude/agents/*.md`)

Five role-specialised subagents. Each is a Claude Code subagent file with frontmatter (`name`, `model`, `tools`) and a system-prompt body.

| Agent | File | Model | Tool scope | Purpose |
|---|---|---|---|---|
| `architect` | `architect.md` | opus | Read, Grep, Glob, opsx:* skills, Edit (only `openspec/changes/**`) | Writes specs (proposal/design). MUST NOT edit code. |
| `implementer` | `implementer.md` | sonnet | Full toolset incl. Bash (rails t, rubocop), sdlc:tdd | Implements per spec. TDD-enforced. |
| `reviewer` | `reviewer.md` | opus | Read, Grep, Glob, `gh pr comment`, `gh pr review` | Skeptical PR review (security, perf, edge, spec match). NO write to repo. |
| `debugger` | `debugger.md` | sonnet | Full toolset + sdlc:debug skill | Invoked on test failure / agent loop. Systematic-debugging methodology. |
| `qa-tester` | `qa-tester.md` | sonnet | Bash (rails t, rspec), Playwright MCP if present | Edge-case hunting, smoke tests. NO production code edits. |

**Concrete system prompts (drafts — to be materialised verbatim in Stage 1):**

#### `architect.md`

```markdown
---
name: architect
description: Writes opsx specs from Trello cards. Never edits app code.
model: opus
tools: Read, Grep, Glob, Edit, Bash(git diff*), Bash(git log*), Skill(opsx*)
---

You are the architect in the SAIVED multi-agent workflow. You translate
Trello cards and human intent into rigorous opsx specifications.

## Mandate
- Read the Trello card via the trello MCP server
- Survey the relevant area of the codebase (read-only)
- Run /opsx:explore to produce exploration.md
- Run /opsx:propose to produce proposal.md with: motivation, scope,
  ≥2 alternatives considered (with trade-offs), explicit out-of-scope,
  acceptance criteria, risk notes
- If the Trello card is ambiguous, post clarifying questions back to the
  card via /trellosync:comment and HALT — do not guess

## Hard constraints
- MUST NOT edit any file outside `openspec/changes/**`
- MUST NOT run application code (`rails t`, `rails s`, migrations, etc.)
- MUST list at least 2 alternatives in every proposal
- MUST mark out-of-scope explicitly (a list, not "nothing else")
- MUST flag every database migration, public route, dependency add, or
  third-party API call as a risk in the proposal
- If the change touches >300 LOC by your estimate, decompose into multiple
  proposals before handoff

## Handoff
You hand off `proposal.md` to the human (Gate 1). You do not invoke the
implementer yourself. The human reads, edits if needed, and runs
`/opsx:apply` when ready, which is the implementer's entry point.

## Failure mode
- Card unclear → comment on card with questions, halt
- Existing spec contradicts request → escalate to human, do not "merge intent"
- Cannot find a sane decomposition → write proposal.md with
  "DECOMPOSITION-NEEDED" status and halt
```

#### `implementer.md`

```markdown
---
name: implementer
description: Implements approved opsx proposals under TDD discipline.
model: sonnet
tools: Read, Grep, Glob, Edit, Write, Bash, Skill(sdlc:tdd), Skill(sdlc:verification), Skill(opsx:apply)
---

You are the implementer in the SAIVED multi-agent workflow. You take an
approved opsx `proposal.md` and produce the code that satisfies it.

## Mandate
- Read the approved proposal in full before touching code
- Run `/sdlc:tdd` to write a FAILING test before any implementation file
- Implement the smallest change that makes the test pass
- Follow existing patterns — read 2-3 neighbouring files before adding new
  code in any directory you have not touched this session
- Run `/sdlc:verification` (rails test + rubocop + brakeman) before
  claiming done

## Hard constraints
- MUST NOT edit `openspec/changes/**` proposals (architect's domain)
- MUST NOT do drive-by refactors outside the proposal's scope
- MUST NOT introduce a new dependency without flagging it for human review
- MUST NOT skip a failing test ("flaky", "unrelated") — escalate to debugger
- MUST keep commits scoped: one logical change per commit
- MUST update CLAUDE.md if you discover the doc lies about current behaviour

## Handoff
You hand off the branch + diff to the human (Gate 2). The human reads,
may rewrite a hunk by hand, and either runs `/sdlc:pr` or invokes
debugger/qa-tester first.

## Failure mode
- Stuck on a test for >2 attempts → switch to debugger subagent (do not
  thrash; one focused failure is more useful than ten attempts)
- Spec turns out to be wrong (the code can't do what the proposal says) →
  HALT, write a brief amendment note, request human spec revision
- External API behaving unexpectedly → write a regression test capturing
  the surprise, then escalate
```

#### `reviewer.md`

```markdown
---
name: reviewer
description: Skeptical PR reviewer. Read-only on repo, comments via gh.
model: opus
tools: Read, Grep, Glob, Bash(gh pr*), Bash(git diff*), Bash(git log*), Bash(bin/rails test*), Bash(bin/rubocop*), Bash(bin/brakeman*)
---

You are the reviewer in the SAIVED multi-agent workflow. Your job is
adversarial: assume the implementer cut corners, and find where.

## Mandate
- Read the proposal AND the diff side by side
- Verify spec ↔ implementation alignment line by line for acceptance criteria
- Check for: missing auth on new routes, N+1 queries, PII in serializers,
  missing edge-case tests, swallowed exceptions, time-zone bugs, race
  conditions in jobs, dependency licence concerns
- Post review via `gh pr review --comment` (line-level) and a top-level
  summary via `gh pr comment`

## Hard constraints
- MUST NOT edit any file in the repository
- MUST NOT approve a PR via this agent — approval is a human act
- MUST flag every undocumented deviation from the proposal
- MUST run a separate, fresh `bin/rails test` and report any failure
- MUST NOT invoke the implementer agent yourself

## Handoff
You produce review comments on the GitHub PR. The implementer (or human)
addresses them. You may be re-invoked after fixes.

## Failure mode
- Proposal itself seems wrong → escalate to human in a top-level PR
  comment tagged `@architect-needed`, do NOT silently approve
- Diff is too large to review meaningfully (>500 LOC of non-test code) →
  comment "TOO LARGE — request decomposition" and stop
```

#### `debugger.md`

```markdown
---
name: debugger
description: Invoked when a test fails or implementer is stuck. Systematic.
model: sonnet
tools: Read, Grep, Glob, Edit, Write, Bash, Skill(superpowers:systematic-debugging)
---

You are the debugger in the SAIVED multi-agent workflow. You are invoked
by the implementer or by a human when the path forward is unclear.

## Mandate
- Apply the superpowers:systematic-debugging methodology:
  1. State the symptom precisely (what fails, what was expected)
  2. Form ≤3 hypotheses, ranked by prior probability
  3. Design the smallest experiment that distinguishes them
  4. Run it, narrow, repeat
- Reproduce the bug deterministically before proposing a fix
- After fix, log root cause + fix + prevention to
  `docs/superpowers/retros/YYYY-MM-DD-<topic>.md`

## Hard constraints
- MUST NOT change code unrelated to the active hypothesis
- MUST NOT skip a test, mark it pending, or relax an assertion to make CI
  green ("make it pass" via test mutilation is forbidden)
- MUST run the full test suite after the fix lands, not just the
  previously failing test
- MUST cite the failing assertion (file:line) in any retro

## Handoff
You hand the fixed branch back to the implementer (who continues the
feature) or to the human (if the fix changes the spec).

## Failure mode
- Cannot reproduce locally → document precisely what you tried, escalate
  to human, do NOT mark resolved
- Fix requires a spec change → write a retro note + halt; the architect
  must amend the proposal
- More than 3 dead-end hypotheses in a row → halt, hand off to human
  with the full hypothesis log
```

#### `qa-tester.md`

```markdown
---
name: qa-tester
description: Edge-case hunter and smoke tester. Adds tests, never prod code.
model: sonnet
tools: Read, Grep, Glob, Edit, Write, Bash(bin/rails test*), Bash(gh pr*)
---

You are the qa-tester in the SAIVED multi-agent workflow. You hunt for
the inputs the implementer did not consider.

## Mandate
- For each acceptance criterion in the proposal, generate at least 5
  adversarial inputs: empty, null, boundary, concurrent, malformed
- Add Minitest cases under `test/**` for any missing coverage
- Run `bin/rails test` and `bin/rails test:system` if relevant
- Post a QA report as a PR comment listing: what was tested, what passed,
  what failed, what you suspect is untested

## Hard constraints
- MUST NOT edit anything under `app/**`, `lib/**`, `db/**`, or `config/**`
- MAY add new test files and test helpers
- MUST report bugs as PR comments, NOT fix them yourself
- MUST keep added tests deterministic (no `sleep`, no real network)

## Handoff
QA report posted on the PR. The implementer (or human) decides whether
to fix or accept the risk.

## Failure mode
- Cannot find a meaningful adversarial input → comment "NO MEANINGFUL
  EDGE CASES — feature surface trivial" rather than padding with
  duplicates
- Test infra broken → escalate to debugger, do NOT skip QA silently
```

**Cross-agent invariants** (enforced by repo conventions, not in any single prompt):

- Only the `implementer` writes to `app/**`, `lib/**`, `db/**`, `config/**`
- Only the `architect` writes to `openspec/changes/**`
- Only `qa-tester` and `implementer` write to `test/**`
- Every agent may write to `docs/superpowers/retros/**` (post-mortems welcome from anyone)
- No agent may edit `.claude/agents/**`, `.claude/plugins/**`, `.claude/settings.json` — those are human-curated

### 3.2 Plugin `opsx` (existing — kept as-is)

Reference. Already installed in `saived-backend/.claude/commands/opsx/` and `.claude/skills/`. No changes in this spec, except: ensure `opsx:onboard` works when invoked by the new dev (§8).

### 3.3 Plugin `sdlc` (port subset from Terro)

Six skills, ported from `agent-plugins/plugins/sdlc/` in Terro. Live under `saived-backend/.claude/plugins/sdlc/skills/<name>.md`.

| Skill | Purpose | Notes / changes from Terro |
|---|---|---|
| `sdlc:tdd` | Force failing test first, then implementation | Adapt commands to Minitest (`bin/rails test`) |
| `sdlc:pr` | Generate PR with **dynamic** checklist | **Modified vs. Terro** — see §5 |
| `sdlc:parallel` | Spawn N implementers in `git worktree`s | Adapt branch naming to SAIVED conventions |
| `sdlc:verification` | Run all gates (tests, rubocop, brakeman) before PR | Adapt to Rails toolchain |
| `sdlc:retro` | Post-session retro logged to `docs/superpowers/retros/YYYY-MM-DD.md` | New retro location |
| `sdlc:debug` | Load systematic-debugging methodology when invoked | Stays close to Terro version |

**Dropped from Terro `sdlc` (out of scope here):** canary, change-digest, security (CI Brakeman covers it), worktree (folded into parallel), setup-repo, qa, change-digest.

### 3.4 Plugin `trellosync` (NEW — built from scratch)

Lives in `saived-backend/.claude/plugins/trellosync/skills/`. Four skills.

| Skill | Args | Behaviour |
|---|---|---|
| `trellosync:start` | `<CARD_ID>` | 1) `trello_get_card` via MCP. 2) Create branch `feat/<slug-from-title>`. 3) Run `/opsx:new` with card description as input. 4) `trello_move_card → "In Progress"`. 5) `trello_comment_card` with branch URL. |
| `trellosync:ship` | (current branch) | 1) Read open PR via `gh pr view`. 2) Parse `Trello-Card: <id>` from PR body. 3) `trello_comment_card` with PR URL. 4) `trello_move_card → "W testach (Marti)"`. |
| `trellosync:backlog` | — | `trello_list_cards "To Do"` → markdown table. |
| `trellosync:comment` | `<CARD_ID> <text>` | Utility for any agent to update a card. |

**Failure modes the skill explicitly handles:**
- Card ID not found → abort with clear error, no branch created
- Branch already exists → confirm with user before reusing
- Trello API rate limit → exponential backoff (3 retries, 2/4/8s)
- Missing TRELLO_KEY/TOKEN → fail fast with setup link

### 3.5 Trello MCP server

**Location:** `saived-backend/tooling/trello-mcp/` (in repo, not external)
**Stack:** Node 20 + TypeScript + `@modelcontextprotocol/sdk`
**Size:** ~200 LOC across `src/index.ts`, `src/trello-client.ts`, `src/tools.ts`
**Auth:** reads `TRELLO_KEY` and `TRELLO_TOKEN` from env (sourced from `~/.trello_credentials` via shell).

**Tools exposed:**

| Tool | Args (JSON Schema) | Returns |
|---|---|---|
| `trello_list_cards` | `{ list_name: string }` | `Array<{ id, name, desc, url, due, labels[] }>` |
| `trello_get_card` | `{ card_id: string }` | full card incl. comments, members, checklists |
| `trello_move_card` | `{ card_id: string, target_list: string }` | `{ ok: true }` |
| `trello_comment_card` | `{ card_id: string, text: string }` | `{ comment_id: string }` |
| `trello_get_board` | `{}` | `{ lists: Array<{ name, count }>, members[] }` |

**`.mcp.json` (project-scoped) at `saived-backend/.mcp.json`:**

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

**Build:** `cd tooling/trello-mcp && npm run build` (TypeScript → `dist/`). README in folder.

### 3.6 GitHub Actions (NEW workflows)

All under `saived-backend/.github/workflows/`:

| Workflow | Trigger | Job |
|---|---|---|
| `claude-review.yml` | `issue_comment` containing `@claude` on PR | Run `anthropics/claude-code-action@v1` with `ANTHROPIC_API_KEY` secret. Posts review comments back. |
| `trello-sync.yml` | `pull_request: closed` AND `merged == true` | 1) Parse `Trello-Card: <id>` regex from PR body. 2) PUT `https://api.trello.com/1/cards/<id>?idList=<DONE_LIST_ID>`. 3) POST comment with merged commit URL. Uses `TRELLO_KEY`/`TRELLO_TOKEN` org secrets. |
| `deploy.yml` | `push` to `main` | `flyctl deploy` using `FLY_API_TOKEN` secret. Posts release URL to merged PR. |

**Existing `ci.yml`** stays unchanged.

### 3.7 Hooks & guardrails (`.claude/settings.json`)

```json
{
  "permissions": {
    "allow": [
      "Bash(bin/rails test*)",
      "Bash(bin/rubocop*)",
      "Bash(bin/brakeman*)",
      "Bash(git*)",
      "Bash(gh pr*)",
      "Bash(npm run*)",
      "Bash(yarn*)",
      "Edit(**/*)",
      "Read(**/*)"
    ],
    "deny": [
      "Bash(bin/rails db:reset*)",
      "Bash(bin/rails db:drop*)",
      "Bash(rm -rf*)",
      "Bash(git push --force*main*)",
      "Read(.env*)",
      "Read(**/trello_credentials*)",
      "Read(**/.fly.toml.secrets)"
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
      { "matcher": "Bash",  "hooks": [ { "type": "command", "command": ".claude/hooks/audit_log.sh" } ] },
      { "matcher": "Edit",  "hooks": [ { "type": "command", "command": ".claude/hooks/audit_log.sh" } ] },
      { "matcher": "Write", "hooks": [ { "type": "command", "command": ".claude/hooks/audit_log.sh" } ] }
    ]
  }
}
```

**Hooks (in `.claude/hooks/`, executable shell):**

- `pre_bash_guard.sh` — extra safety: blocks `db:seed` in production env, `git checkout main && git push` patterns
- `audit_log.sh` — appends `{timestamp, tool, args, exit}` to `.claude/logs/session-YYYY-MM-DD.jsonl`

Audit log is the on-camera proof of "everything is logged" during the Loom.

---

## 4. End-to-end workflow

```
Trello "To Do"
    │   user: /trellosync:start <CARD_ID>
    ▼
[trellosync:start]
    ├── MCP: trello_get_card
    ├── git checkout -b feat/<slug>
    ├── /opsx:new (card desc as seed)
    ├── MCP: trello_move_card → "In Progress"
    └── MCP: trello_comment_card (branch URL)
    │
    ▼ (subagent: architect)
[opsx:explore] → openspec/changes/<id>/exploration.md
[opsx:propose] → openspec/changes/<id>/proposal.md
    │
    🛑 GATE 1 — HUMAN REVIEWS PROPOSAL
       human reads proposal.md, edits if needed, runs /opsx:apply when ready
    │
    ▼ (subagent: implementer  OR  sdlc:parallel → 2× implementers in worktrees)
[sdlc:tdd] failing test FIRST
[opsx:apply] implementation
[sdlc:verification] rails t + rubocop + brakeman
    │
    🛑 GATE 2 — HUMAN REVIEWS DIFF
       human reads diff, may rewrite a hunk by hand or invoke debugger
    │
    ▼
[sdlc:pr]
    ├── opens GH PR
    ├── PR body: Trello-Card: <id>, link to proposal.md
    └── PR body: dynamic checklist (§5)
    │
    ▼
GitHub Actions:
    ├── ci.yml (Minitest + Rubocop + Brakeman)
    └── claude-review.yml (on @claude mention) → reviewer agent comments
    │
    🛑 GATE 3 — HUMAN TICKS PRE-MERGE CHECKLIST
       all required boxes checked, then human merges
    │
    ▼
GitHub Actions on merge:
    ├── trello-sync.yml → MCP-equivalent → card "Done" + commit comment
    └── deploy.yml → fly deploy → release URL posted to PR
    │
    🛑 GATE 4 — HUMAN TICKS POST-MERGE CHECKLIST
       smoke test prod, verify logs, confirm rollback command
    │
    ▼
[opsx:archive] → openspec/archive/<id>/
[sdlc:retro]   → docs/superpowers/retros/<date>.md (optional)
```

**Four gates, not three** (revised from earlier draft) — added GATE 4 because post-merge verification is half of what production-readiness means and it's literally a question in the brief.

**Multi-agent orchestration answer:**

- **Sequential (default):** architect → implementer → reviewer → qa-tester. Coordinated via opsx artefacts (proposal as contract).
- **Parallel (sdlc:parallel):** when proposal flags 2+ independent slices, fan out to N implementers in N `git worktree`s, each on its own branch. Reviewer agent merges outputs at the end (rebase-merge). Coordination contract = the same opsx proposal — each slice has its own section.
- **Independent (rare):** debugger or qa-tester can run independently against `main` to investigate without blocking dev.

---

## 5. Dynamic PR checklist heuristics (sdlc:pr)

`sdlc:pr` reads three inputs: `git diff main...HEAD`, the active opsx `proposal.md`, the Trello card. Emits PR body with **base** items (always present) + **conditional** items (signal-driven).

### Always present

```markdown
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

### Conditional rules

| Diff signal | Adds to pre-merge |
|---|---|
| `db/migrate/*` modified | `[ ] Migration tested up & down on copy of prod data` + `[ ] Rollback plan documented in PR` |
| `app/controllers/api/**` modified | `[ ] No backward-incompatible API change OR version bumped` |
| `app/views/**`, `app/javascript/**`, or extension JS | `[ ] Before/after screenshot in PR description` |
| `Gemfile` or `package.json` deps added | `[ ] License of new dep verified` + `[ ] Brakeman re-run after Gemfile.lock change` |
| `config/routes.rb` modified | `[ ] No new public route without auth` |
| `app/models/**` with new association | `[ ] N+1 verified (bullet log clean)` |
| New job class (`app/jobs/**`) | `[ ] Idempotency confirmed` |
| `app/serializers/**` modified | `[ ] No PII leak in serialized output` |
| Background sync / external API call added | `[ ] Retry strategy + circuit-breaker considered` |

**Implementation:** `sdlc:pr` skill body includes the heuristic table; agent computes diff signals and assembles the markdown body before opening PR via `gh pr create`.

---

## 6. Defining requirements for agents (workflow contract)

Three inputs the agent expects:

1. **Trello card** — title + description + acceptance criteria (free-form, but skill `trellosync:start` extracts and seeds opsx)
2. **opsx proposal** — formal contract (motivation, scope, alternatives considered, out-of-scope, acceptance) — generated by `architect` agent, edited by human
3. **CLAUDE.md** — project conventions (always loaded)

Anything outside these three is the human's responsibility to provide (Slack threads, Linear comments, hallway chats are NOT inputs).

---

## 7. Failure modes & recovery (organic in demo, not a formal toolkit)

The brief asks "what when agent gets stuck or did wrong". Answered organically — during the Loom demo, when the agent inevitably misfires (and it will, even on retake), the recorded behaviour is:

- `git checkout . && git clean -fd` for a nuclear reset
- Switch to `debugger` subagent for systematic root-cause
- Disposable worktree for failed parallel slice (`git worktree remove --force`)
- Spec amendment via `/opsx:explore` again with new context
- Manual override (human writes the hunk, agent continues)

**Not built as a formal "recovery toolkit" deliverable.** Just demonstrated live.

---

## 8. Onboarding (new dev arrives in a month)

Materials left behind:

- `CLAUDE.md` — workflow contract (updated to reference all of the above)
- `AGENTS.md` — Codex-parity instructions (same workflow, slightly adapted phrasing)
- `docs/superpowers/specs/` — this spec + every per-feature opsx proposal kept in `openspec/archive/`
- `.claude/agents/` — five subagents with documented mandate/handoff/constraints
- `.claude/plugins/` — three plugin packages, each with README
- `.claude/hooks/` — guardrail scripts with comments explaining each rule
- `docs/superpowers/retros/` — past retros (lessons learned over time)

**New dev's first day:**

1. Clone repo, run `bin/setup`, get `~/.trello_credentials` from password manager
2. Run `/opsx:onboard` — guided walkthrough with narration
3. Read `CLAUDE.md` end-to-end (~30 min)
4. Pick a card from `/trellosync:backlog`, run `/trellosync:start <id>` — full flow guided

**New dev's first feature:** identical to senior's flow. There is no privileged path.

**What can go wrong (with prevention):**

| Risk | Prevention |
|---|---|
| Cargo-cult skill use ("just run the macro") | `sdlc:retro` weekly forces reflection; reviewer agent flags blind copies |
| Agent hallucinates Rails API | `sdlc:tdd` requires failing test first → invented method shows up immediately |
| Skipping verification because CI is green | Pre-merge checklist requires *human* tick on items CI can't check (e.g., "logs sane 5 min") |
| Stale CLAUDE.md drifts from reality | New dev edits CLAUDE.md as part of `sdlc:retro` whenever a skill misfires |
| Trello credentials leak via env | `Read(.env*)` and `Read(**/trello_credentials*)` denied at settings level |
| Force-push to main bypassing review | `Bash(git push --force*main*)` denied |

---

## 9. Build order

| # | Stage | Output | Verification |
|---|---|---|---|
| 1 | Foundation | sdlc plugin ported, 5 subagents, hooks in settings.json, audit log dir | Claude Code starts cleanly, `/opsx` works, agents listed |
| 2 | Trello layer | MCP server built, `.mcp.json` configured | `trello_list_cards "To Do"` returns real cards |
| 3 | trellosync plugin | 4 skills | `/trellosync:start <test_card>` creates branch, opsx folder, moves card |
| 4 | Dynamic PR checklist | `sdlc:pr` heuristics | Synthetic diffs produce different checklists |
| 5 | GH Actions | 3 workflows + secrets configured | Test PR triggers all three |
| 6 | Docs | CLAUDE.md, AGENTS.md updated; READMEs in plugin/MCP folders | New dev could read and follow |
| 7 | E2E dry run | (TBD feature) — full flow on a fake or trivial card | Whole pipeline green, no manual fixups |
| 8 | Loom recording | Outline + recording + edit | Final mp4/loom URL |

**Feature for stages 7–8 is deferred** — picked after ecosystem is stable.

---

## 10. Out of scope (explicit cuts)

- Monorepo root (saived-extension stays in its own repo)
- Sidekiq Trello pollers (pull is on-demand, not reactive)
- Custom output style / statusline
- Full Terro `sdlc` plugin (only 6 of ~15 skills ported)
- Custom claude-review action (using upstream `anthropics/claude-code-action`)
- Mission-control UI / dashboard (CLI-only)
- Slack notifications
- Migration of opsx to a newer artefact format (kept as-is)

---

## 11. Open questions / TBD

- **Demo feature pick** — to be decided before Stage 7. Candidates noted in conversation: dashboard total project value, top vendors widget, project completion %, last activity feed.
- **Loom narrative timing breakdown** — written separately once ecosystem is in place (Stage 8).
- **Whether to commit `.mcp.json` to repo** — yes by default, but credentials must remain external. Spec assumes shell-injected env.

---

## 12. Success criteria

The ecosystem is "done" when, on a fresh clone of `saived-backend`:

1. Reading `CLAUDE.md` + `AGENTS.md` is sufficient to start contributing.
2. `/trellosync:backlog` returns real cards.
3. `/trellosync:start <ANY_CARD>` produces a branch, opsx scaffold, and Trello move.
4. `/sdlc:pr` produces a context-tailored checklist.
5. A merged PR causes the Trello card to move to "Done" and triggers a Fly.io deploy automatically.
6. The full demo flow can be performed in 6–7 minutes of footage (with cuts).

---

*End of spec.*
