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
