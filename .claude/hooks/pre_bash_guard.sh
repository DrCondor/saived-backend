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
