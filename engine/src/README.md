Supplementary architecture modules.

These files document the design of Pipeline's spending governance engine.
They are not directly imported by `server.ts` (which is self-contained for
deployment simplicity), but correspond to the logical layers described in
the README architecture section:

  batch-queue.ts     → Gateway gasless batching aggregator
  policy-resolver.ts → Onchain rule evaluation with caching
  rate-limiter.ts    → Token bucket per-agent-per-category
  outcome-gater.ts   → Outcome-gated tranche release

Each has its own vitest suite in `engine/test/`.

The self-contained `server.ts` inlines equivalent logic for deployment
simplicity, but these modules remain as the canonical design reference.
