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
