#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${ARC_RPC_URL:-http://localhost:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-}"
VERIFIER_URL="${ARC_VERIFIER_URL:-}"

if [ -z "$PRIVATE_KEY" ]; then
  echo "error: PRIVATE_KEY not set"
  exit 1
fi

echo "=== deploying PipelinePolicy to Arc testnet ==="
echo "rpc: $RPC_URL"

forge create contracts/src/PipelinePolicy.sol:PipelinePolicy \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --legacy

echo "=== deployment complete ==="
