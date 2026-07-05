import express, { Request, Response } from "express";
import { ethers } from "ethers";
import { PolicyResolver } from "./policy-resolver";
import { RateLimiter } from "./rate-limiter";
import { BatchQueue, BatchEntry } from "./batch-queue";

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
];
const signer = process.env.PRIVATE_KEY
  ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  : provider;

const contract = new ethers.Contract(POLICY_ADDRESS, policyAbi, signer);
const resolver = new PolicyResolver(contract);
const rateLimiter = new RateLimiter();

const batchQueue = new BatchQueue(async (batch: BatchEntry[]) => {
  console.log(`[batch] flushing ${batch.length} entries to Gateway`);
}, 5000, 100);

batchQueue.start();

app.post("/x402/preflight", async (req: Request, res: Response) => {
  const { agent, endpoint, method = "0x00000000", amount = "1000000" } = req.body;

  if (!agent || !endpoint) {
    res.status(400).json({ allowed: false, reason: "missing agent or endpoint" });
    return;
  }

  const amountBN = BigInt(amount);
  const rateCheck = rateLimiter.allow(agent, "default");

  if (!rateCheck.allowed) {
    res.status(429).json({
      allowed: false,
      reason: `rate limited, retry in ${rateCheck.retryAfterMs}ms`,
      retryAfterMs: rateCheck.retryAfterMs,
    });
    return;
  }

  const result = await resolver.check(agent, endpoint, method, amountBN);
  const statusCode = result.allowed ? 200 : 403;

  if (result.allowed) {
    batchQueue.enqueue({ agent, endpoint, method, amount, approved: true });
  }

  res.status(statusCode).json(result);
});

app.get("/budget/:agent", async (req: Request, res: Response) => {
  const { agent } = req.params;
  const budgetId = await resolver.getBudgetIdForAgent(agent);

  if (budgetId === null || budgetId === 0n) {
    res.status(404).json({ error: "no budget found for agent" });
    return;
  }

  const status = await resolver.getBudgetStatus(budgetId);
  res.json({ budgetId: budgetId.toString(), ...status });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), queueDepth: batchQueue.length });
});

app.listen(PORT, () => {
  console.log(`[pipeline] engine listening on port ${PORT}`);
  console.log(`[pipeline] arc rpc: ${ARC_RPC}`);
  console.log(`[pipeline] policy contract: ${POLICY_ADDRESS}`);
});
