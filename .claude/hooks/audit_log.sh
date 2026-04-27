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
