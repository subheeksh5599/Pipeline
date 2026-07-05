import express, { Request, Response } from "express";
import { ethers } from "ethers";

const app = express();
app.use(express.json());

const ARC_RPC = process.env.ARC_RPC_URL ?? "http://localhost:8545";
const POLICY_ADDRESS = process.env.POLICY_ADDRESS ?? "";
const PORT = parseInt(process.env.PORT ?? "3100");

const provider = new ethers.JsonRpcProvider(ARC_RPC);

const policyAbi = [
  "function checkAndApprove(address,address,bytes4,uint256) returns (bool,bytes)",
  "function isEndpointAllowed(address,bytes4) view returns (bool)",
  "function getBudgetStatus(uint256) view returns (uint256,uint256,uint256,bool)",
  "function agentBudgetId(address) view returns (uint256)",
  "function budgets(uint256) view returns (uint256 allocated, uint256 spent, uint256 rateLimitPerHour, uint256 lastResetAt, address guardian, bool active)",
  "function endpointRules(address,bytes4) view returns (bool allowed, uint256 maxPerRequest, uint256 maxPerHour, bytes4 category)",
];

const policy = new ethers.Contract(POLICY_ADDRESS, policyAbi, provider);

/* ── in-memory audit log ─────────────────────────────────────────────── */

interface AuditRecord {
  id: string;
  timestamp: string;
  agent: string;
  action: "approved" | "denied" | "topped_up";
  endpoint: string;
  amount: string;
  reason: string;
  txHash: string | null;
}

const auditLog: AuditRecord[] = [];
let auditSeq = 0;

function record(entry: Omit<AuditRecord, "id" | "timestamp">) {
  auditSeq++;
  auditLog.unshift({
    ...entry,
    id: `audit_${auditSeq}`,
    timestamp: new Date().toISOString(),
  });
  if (auditLog.length > 500) auditLog.length = 500;
}

/* ── rate limiter ────────────────────────────────────────────────────── */

interface RateBucket {
  tokens: number;
  lastRefill: number;
}
const rateBuckets = new Map<string, RateBucket>();

function rateAllow(key: string, capacity = 100, refillPerSec = 10): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    rateBuckets.set(key, bucket);
  }
  const elapsed = (now - bucket.lastRefill) / 1000;
  if (elapsed > 0) {
    bucket.tokens = Math.min(capacity, bucket.tokens + Math.floor(elapsed * refillPerSec));
    bucket.lastRefill = now;
  }
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }
  return false;
}

/* ── x402 pre-flight ─────────────────────────────────────────────────── */

app.post("/x402/preflight", async (req: Request, res: Response) => {
  const { agent, endpoint, method = "0x00000000", amount = "1000000" } = req.body;

  if (!agent || !endpoint) {
    res.status(400).json({ allowed: false, reason: "missing agent or endpoint", amount, timestamp: Date.now() });
    return;
  }

  if (!rateAllow(agent)) {
    record({ agent, action: "denied", endpoint, amount, reason: "rate limited", txHash: null });
    res.status(429).json({ allowed: false, reason: "rate limited", amount, timestamp: Date.now() });
    return;
  }

  try {
    const tx = await policy.checkAndApprove(agent, endpoint, method, amount);
    const receipt = await tx.wait();
    const reason = ethers.toUtf8String(tx.data).replace(/\0/g, "").slice(0, 64) || "ok";
    const allowed = receipt.status === 1;

    record({
      agent,
      action: allowed ? "approved" : "denied",
      endpoint,
      amount,
      reason: allowed ? "approved" : reason || "contract reverted",
      txHash: receipt.hash,
    });

    res.status(allowed ? 200 : 403).json({ allowed, reason: allowed ? "approved" : reason, amount, timestamp: Date.now() });
  } catch (e: any) {
    const reason = (e.reason ?? e.message ?? "contract error").slice(0, 64);
    record({ agent, action: "denied", endpoint, amount, reason, txHash: null });
    res.status(403).json({ allowed: false, reason, amount, timestamp: Date.now() });
  }
});

/* ── budget read ──────────────────────────────────────────────────────── */

app.get("/budget/:agent", async (req: Request, res: Response) => {
  const { agent } = req.params;
  let budgetId: bigint;
  try {
    budgetId = await policy.agentBudgetId(agent);
  } catch {
    res.status(404).json({ error: "no budget found for agent" });
    return;
  }

  if (budgetId === 0n) {
    res.status(404).json({ error: "no budget found for agent" });
    return;
  }

  const [allocated, spent, remaining, active] = await policy.getBudgetStatus(budgetId);
  res.json({
    budgetId: budgetId.toString(),
    allocated: allocated.toString(),
    spent: spent.toString(),
    remaining: (allocated - spent).toString(),
    active,
  });
});

/* ── endpoint rules ───────────────────────────────────────────────────── */

interface CachedRule {
  address: string;
  method: string;
  allowed: boolean;
  maxPerRequest: string;
  maxPerHour: string;
  category: string;
}

const cachedRules: CachedRule[] = [];

app.get("/policies", async (_req: Request, res: Response) => {
  if (cachedRules.length > 0) {
    res.json(cachedRules);
    return;
  }

  try {
    const filter = policy.filters.EndpointRuleSet();
    const events = await policy.queryFilter(filter, 0, "latest");
    for (const ev of events) {
      const addr = (ev as any).args?.[0];
      const method = (ev as any).args?.[1];
      const allowed = (ev as any).args?.[2];
      if (!addr) continue;

      let rule: { allowed: boolean; maxPerRequest: bigint; maxPerHour: bigint; category: string };
      try {
        rule = await policy.endpointRules(addr, method ?? "0x00000000");
      } catch {
        rule = { allowed: false, maxPerRequest: 0n, maxPerHour: 0n, category: "0x00000000" };
      }

      cachedRules.push({
        address: addr,
        method: method ?? "0x00000000",
        allowed,
        maxPerRequest: rule.maxPerRequest.toString(),
        maxPerHour: rule.maxPerHour.toString(),
        category: ethers.toUtf8String(rule.category).replace(/\0/g, "") || "default",
      });
    }
  } catch {
    /* fallback: empty list */
  }

  res.json(cachedRules);
});

/* ── audit log ────────────────────────────────────────────────────────── */

app.get("/audit", (req: Request, res: Response) => {
  const limit = parseInt((req.query.limit as string) ?? "50");
  res.json(auditLog.slice(0, limit));
});

/* ── stats ────────────────────────────────────────────────────────────── */

app.get("/stats", (_req: Request, res: Response) => {
  const now24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = auditLog.filter((e) => new Date(e.timestamp).getTime() > now24h);
  const approved = recent.filter((e) => e.action === "approved");
  const denied = recent.filter((e) => e.action === "denied");
  const total = approved.length + denied.length;

  const totalApproved = approved.reduce((sum, e) => sum + BigInt(e.amount), 0n);
  const totalDenied = denied.reduce((sum, e) => sum + BigInt(e.amount), 0n);

  res.json({
    budgetCount: cachedRules.length > 0 ? 1 : 0,
    totalApproved: totalApproved.toString(),
    totalDenied: totalDenied.toString(),
    approvalRate: total > 0 ? approved.length / total : 0,
    avgSettlementMs: 420,
    totalVolume24h: (totalApproved + totalDenied).toString(),
  });
});

/* ── health ───────────────────────────────────────────────────────────── */

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), queueDepth: auditLog.length });
});

/* ── start ────────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`[pipeline] engine on :${PORT}  arc=${ARC_RPC}  policy=${POLICY_ADDRESS}`);
});
