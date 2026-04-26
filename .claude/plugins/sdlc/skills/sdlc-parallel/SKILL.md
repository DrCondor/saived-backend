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
