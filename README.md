# Pipeline

**The programmable spending engine for AI agents on Arc.**

Give an agent a wallet and it will drain you. Pipeline sits between every Circle wallet and every x402 endpoint, governing every cent an agent spends — budgets, rate limits, endpoint ACLs, and outcome-gated tranches — all enforced onchain on Arc with gasless settlement through Gateway.

## The problem

Circle's Agent Stack gives an agent a wallet. x402 gives it something to pay for. Nobody is governing the spend between them. An autonomous agent with unrestricted spending authority is a liability. It needs a CFO.

Pipeline is that CFO: programmable, onchain, composable.

## How it works

```
Agent ──spend request──▶ Pipeline Engine ──policy check──▶ Arc Contract
                              │  ┌──────────────┐              │
                              │  │ Policy Resolver│◀── rules ──┘
                              │  ├──────────────┤
                              │  │ Rate Limiter  │
                              │  ├──────────────┤
                              │  │ Outcome Gater │
                              │  ├──────────────┤
                              │  │ Batch Queue  │────▶ Gateway (gasless)
                              │  └──────────────┘
                              │
                          APPROVED ──▶ USDC settles on Arc in <500ms
                          DENIED   ──▶ logged to dashboard
```

1. Agent hits an x402 endpoint wanting to pay
2. Pipeline Engine intercepts the pre-flight (x402 pre-flight hook, <100ms)
3. Runs it through: policy rules → rate limiter → outcome gater
4. Approved transactions batch through Gateway gasless
5. Denied transactions log the reason, human gets a dashboard alert
6. Everything audited onchain via `PipelinePolicy.sol`

## Architecture

```
pipeline/
├── contracts/                        # Solidity (Foundry)
│   ├── src/
│   │   └── PipelinePolicy.sol        # Budgets, ACLs, outcome bonds
│   ├── test/
│   │   └── PipelinePolicy.t.sol      # Foundry test suite
│   └── foundry.toml
├── engine/                           # Offchain approval engine (TypeScript)
│   └── src/
│       ├── server.ts                 # Express server, x402 pre-flight interceptor
│       ├── policy-resolver.ts        # Onchain rule evaluation + cache
│       ├── rate-limiter.ts           # Token bucket per agent per category
│       ├── batch-queue.ts            # Gateway gasless batch aggregator
├── dashboard/                        # Next.js operator dashboard
│   └── app/
│       ├── page.tsx                  # Budget overview + real-time activity
│       ├── policies/page.tsx         # Endpoint rule builder
│       └── audit/page.tsx            # Full spend log
├── scripts/
│   ├── deploy.sh                     # Foundry deploy to Arc testnet
│   └── bootstrap-policy.ts           # Seed budgets + endpoint rules
└── README.md
```

## Contract design

`PipelinePolicy.sol` is the onchain audit trail. It stores budgets, endpoint ACLs, and outcome bonds as canonical state. The offchain engine calls it for every approval; denials are logged offchain; approved spends are committed through the contract so the state is always verifiable.

### State

| Mapping | Key → Value | Purpose |
|---------|-------------|---------|
| `budgets` | `budgetId → Budget` | Allocated, spent, rate limit per hour, guardian, active flag |
| `endpointRules` | `(endpoint, method) → EndpointRule` | Per-endpoint allow/deny, per-request cap, per-hour cap, category |
| `outcomeBonds` | `bondId → OutcomeBond` | Amount staked, provider, task hash, resolved, delivered |
| `agentBudgetId` | `agent → budgetId` | Which budget an agent spends from |

### Functions

| Function | Who calls | What it does |
|----------|-----------|--------------|
| `createBudget(agent, allocated, rateLimit)` | guardian (owner) | Create a spending budget for an agent |
| `topUpBudget(id, amount)` | guardian | Add funds to a budget |
| `releaseTranche(id, amount)` | guardian | Outcome-gated: release next tranche only if prior bond resolved as delivered |
| `setEndpointRule(endpoint, method, allowed, maxPerReq, maxPerHr, category)` | owner | Add or update a spending rule |
| `checkAndApprove(agent, endpoint, method, amount)` | engine | Pre-flight check: budget sufficient? endpoint allowed? per-request cap? |
| `createOutcomeBond(provider, amount, taskHash)` | owner | Stake USDC behind a task — slashed if not delivered |
| `resolveOutcomeBond(id, delivered)` | owner | Resolve a bond after task completion |
| `getBudgetStatus(id)` | anyone | Read budget state (allocated, spent, remaining, active) |
| `isEndpointAllowed(endpoint, method)` | anyone | Check if an endpoint is currently allowed |

## The Engine

The engine is the decision layer. It sits between agent wallets and x402 endpoints as a pre-flight interceptor.

### `POST /x402/preflight`

Called by every agent spend attempt before the payment routes.

```json
// Request
{
  "agent": "0x...",
  "endpoint": "0x...",
  "method": "0x00000000",
  "amount": "1000000"
}

// Approved (200)
{
  "allowed": true,
  "reason": "approved",
  "amount": "1000000",
  "timestamp": 1718400000000
}

// Denied (403)
{
  "allowed": false,
  "reason": "budget exceeded",
  "amount": "1000000",
  "timestamp": 1718400000000
}
```

### `GET /budget/:agent`

Returns the current budget status for a given agent address.

### `GET /health`

Returns engine uptime, queue depth, and health status.

## The Dashboard

A Next.js operator dashboard for humans managing agent budgets.

- **Overview** — all budgets, current spend, remaining, status (active / exhausted)
- **Policies** — endpoint rule builder, blocklist management, per-category rate limits
- **Audit** — full spend log, every approval and denial with timestamps and reasons

## Prerequisites

- Node.js v20.18.2+
- Foundry (forge, cast)
- ARC CLI installed and configured
- Circle CLI installed
- Testnet USDC (use TestMint: up to $10k in test USDC via x402)

## Quick start

### 1. Install tooling

```bash
# ARC CLI — gives RPC access + agent context
uv tool install git+https://github.com/the-canteen-dev/ARC-cli

# Circle CLI — wallets, x402, crosschain USDC
npm install -g @circle-fin/cli

# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Clone and install

```bash
git clone https://github.com/your-org/pipeline.git
cd pipeline

# Install engine dependencies
cd engine && npm install && cd ..

# Install dashboard dependencies
cd dashboard && npm install && cd ..

# Install Foundry dependencies
cd contracts && forge install && cd ..
```

### 3. Deploy the contract

```bash
export ARC_RPC_URL="<your-arc-testnet-rpc>"
export PRIVATE_KEY="<your-deployer-key>"

./scripts/deploy.sh
```

Save the deployed contract address.

### 4. Bootstrap a policy

```bash
export POLICY_ADDRESS="0x..."
export PRIVATE_KEY="<your-deployer-key>"

npx tsx scripts/bootstrap-policy.ts
```

### 5. Start the engine

```bash
cd engine
ARC_RPC_URL="<arc-rpc>" POLICY_ADDRESS="<deployed-address>" npm run dev
```

### 6. Start the dashboard

```bash
cd dashboard
npm run dev
```

## Three-week build plan

### Week 1 — Contract + Engine Core

- [ ] Implement `PipelinePolicy.sol` — budgets, endpoint ACLs, outcome bonds
- [ ] Write Foundry tests — full coverage of all contract paths
- [ ] Deploy to Arc testnet
- [ ] Build engine server — Express, x402 pre-flight endpoint
- [ ] Wire PolicyResolver to read from onchain state
- [ ] Implement RateLimiter (token bucket per agent per category)
- [ ] Test: agent sends spend → engine intercepts → contract approves or denies

### Week 2 — Gateway + Dashboard

- [ ] Implement BatchQueue — aggregate approved spends for Gateway gasless batching
- [ ] Dockerize the engine (Dockerfile, health check, env config)
- [ ] Build dashboard — budget overview, endpoint rule builder
- [ ] Build spend audit log — every approval and denial with timestamps
- [ ] Wire dashboard to engine API for real-time budget status
- [ ] Test end-to-end: agent → engine → contract → Gateway → USDC settles

### Week 3 — Demo + Polish

- [ ] Add outcome-gated tranche release (budget unlocks only when prior bonds resolve as delivered)
- [ ] Build demo: agent tries to overspend → Pipeline blocks it → human adds budget → agent resumes
- [ ] Record 3-minute demo video (Loom/YouTube)
- [ ] Write documentation in the README
- [ ] Deploy live link (optional but strongly encouraged)
- [ ] Submit through the project form (can submit multiple times)

## Circle primitives used

| Primitive | Where it's used |
|-----------|----------------|
| **Wallets** | Every agent gets a Circle wallet — Pipeline governs what that wallet can spend |
| **x402 Protocol** | The pre-flight hook intercepts x402 payment requests before they route through |
| **Gateway Nanopayments** | BatchQueue aggregates approved micro-spends into gasless batches, down to $0.000001 |
| **Contracts** | `PipelinePolicy.sol` is the onchain audit trail — all rules and budgets live on Arc |
| **App Kit** | Unified Balance for cross-category spend tracking, Swap for treasury conversion |

## Required submission materials

- Public GitHub repo (this repo)
- Video demo under 3 minutes (Loom/YouTube/Vimeo)
- Live deployed link (optional but strongly encouraged)
- Submission form: https://forms.gle/SMqLaw2pMGDe58LFA
- Deadline: July 6, 2026, 11:59 PM ET

## Why this wins

| Moat | Mechanism |
|------|-----------|
| **Switch cost** | An agent's spending policy lives in the PipelinePolicy contract. Moving it means rewriting the entire budget logic from scratch. |
| **Policy depth** | The more rules an agent accumulates (don't pay this endpoint, surge during peak hours), the stickier Pipeline gets. |
| **Network position** | Sits between every Circle wallet and every x402 endpoint. All agent spend routes through Pipeline. |
| **Composability** | Once other contracts integrate against Pipeline's approval API, it becomes infrastructure — not a feature. |

No one has built the spending governance layer yet. Every team at this hackathon is building _things you pay for_. Pipeline is the thing that decides whether you're allowed to pay.

## License

MIT
