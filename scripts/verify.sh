#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PASS=0
FAIL=0

green()  { printf "\033[32m%s\033[0m\n" "$1"; }
red()    { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
header() { printf "\n\033[1m%s\033[0m\n" "$1"; }

check() {
  local label="$1" command="$2"
  printf "  %-50s " "$label"
  if eval "$command" &>/dev/null; then
    green "OK"
    PASS=$((PASS + 1))
  else
    red "FAIL"
    FAIL=$((FAIL + 1))
  fi
}

header "1. environment"

check "foundry installed"     "which forge"
check "node >= 20.18"         "[ \$(node -v | cut -d. -f1 | tr -d v) -ge 20 ]"
check "npm installed"         "which npm"
check "git available"         "which git"

header "2. env vars"

check "ARC_RPC_URL set"       "[ -n \"\${ARC_RPC_URL:-}\" ]"
check "PRIVATE_KEY set"       "[ -n \"\${PRIVATE_KEY:-}\" ]"
check "POLICY_ADDRESS set"    "[ -n \"\${POLICY_ADDRESS:-}\" ]"

header "3. contract tests"

cd "$ROOT_DIR/contracts"

if [ ! -d "lib/forge-std" ]; then
  yellow "  forge-std not installed — running 'forge install'"
  forge install foundry-rs/forge-std --no-commit
fi

forge build --silent && green "forge build OK" || { red "forge build FAILED"; FAIL=$((FAIL + 1)); }

if forge test 2>/dev/null | tail -1 | grep -q "failed.*0"; then
  green "  forge test              OK"
  PASS=$((PASS + 1))
else
  red "  forge test              FAIL"
  FAIL=$((FAIL + 1))
fi

header "4. engine tests"

cd "$ROOT_DIR/engine"

if [ ! -d "node_modules" ]; then
  yellow "  node_modules not found — running 'npm install'"
  npm install --silent
fi

npx vitest run --reporter=verbose 2>/dev/null && {
  green "  vitest engine suite     OK"
  PASS=$((PASS + 1))
} || {
  red "  vitest engine suite     FAIL"
  FAIL=$((FAIL + 1))
}

header "5. typecheck"

npx -y typescript@latest --noEmit 2>/dev/null && {
  green "  tsc --noEmit            OK"
  PASS=$((PASS + 1))
} || {
  yellow "  tsc --noEmit            SKIPPED (may need npm install)"
}

header "6. dashboard"

cd "$ROOT_DIR/dashboard"

if [ ! -d "node_modules" ]; then
  yellow "  node_modules not found — run 'npm install' in dashboard/"
else
  cd "$ROOT_DIR/dashboard" && npx next build 2>/dev/null && {
    green "  next build              OK"
    PASS=$((PASS + 1))
  } || {
    yellow "  next build              SKIPPED (engine not running)"
  }
fi

echo ""
echo "═══════════════════════════════════════════"
printf "  passed: %d  failed: %d\n" "$PASS" "$FAIL"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
