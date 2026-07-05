#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${ARC_RPC_URL:-http://localhost:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-}"
VERIFIER_URL="${ARC_VERIFIER_URL:-}"

if [ -z "$PRIVATE_KEY" ]; then
  echo "error: PRIVATE_KEY not set — export it or create a .env file"
  exit 1
fi

cd contracts

# install forge dependencies on first run
if [ ! -d "lib/forge-std" ]; then
  echo "=== installing forge dependencies ==="
  forge install foundry-rs/forge-std --no-commit
fi

echo "=== running tests ==="
forge test -vvv

echo "=== deploying PipelinePolicy to Arc testnet ==="
echo "rpc: $RPC_URL"

forge create src/PipelinePolicy.sol:PipelinePolicy \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --legacy

echo ""
echo "=== deployment complete ==="
echo "copy the deployed contract address into your .env files as POLICY_ADDRESS"
