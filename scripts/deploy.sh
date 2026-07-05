#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RPC_URL="${ARC_RPC_URL:-http://localhost:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-}"

if [ -z "$PRIVATE_KEY" ]; then
  echo "error: PRIVATE_KEY not set — export it or use a .env file"
  exit 1
fi

cd "$ROOT_DIR/contracts"

if [ ! -d "lib/forge-std" ]; then
  echo "=== installing forge dependencies ==="
  forge install foundry-rs/forge-std --no-commit
fi

echo "=== running tests ==="
forge test -vvv

echo ""
echo "=== deploying PipelinePolicy to Arc testnet ==="
echo "rpc: $RPC_URL"

DEPLOY_OUTPUT=$(forge create src/PipelinePolicy.sol:PipelinePolicy \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --legacy \
  --json 2>/dev/null || forge create src/PipelinePolicy.sol:PipelinePolicy \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --legacy 2>&1)

CONTRACT_ADDR=$(echo "$DEPLOY_OUTPUT" | grep -oP '0x[a-fA-F0-9]{40}' | head -1)

if [ -z "$CONTRACT_ADDR" ]; then
  echo "warning: could not extract contract address from output"
  echo "full output:"
  echo "$DEPLOY_OUTPUT"
else
  echo ""
  echo "=== deployed ==="
  echo "contract: $CONTRACT_ADDR"

  cat > "$ROOT_DIR/.env.pipeline" <<EOF
# PipelinePolicy contract — deployed $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Arc testnet RPC: $RPC_URL
POLICY_ADDRESS=$CONTRACT_ADDR
EOF
  echo "saved to: .env.pipeline"

  echo ""
  echo "copy this to your env files:"
  printf "  export POLICY_ADDRESS=%s\n" "$CONTRACT_ADDR"
  printf "  echo 'POLICY_ADDRESS=%s' >> engine/.env\n" "$CONTRACT_ADDR"
  printf "  export POLICY_ADDRESS=%s        # docker-compose\n" "$CONTRACT_ADDR"
fi
