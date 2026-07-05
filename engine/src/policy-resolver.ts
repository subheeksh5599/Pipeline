import { ethers } from "ethers";

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  amount: bigint;
  timestamp: number;
}

export interface BudgetStatus {
  allocated: bigint;
  spent: bigint;
  remaining: bigint;
  active: boolean;
}

export class PolicyResolver {
  private contract: ethers.Contract;
  private cachedRules: Map<string, { allowed: boolean; maxPerRequest: bigint }>;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.cachedRules = new Map();
  }

  async check(agent: string, endpoint: string, method: string, amount: bigint): Promise<PolicyCheckResult> {
    const ruleKey = `${endpoint}:${method}`;
    let rule = this.cachedRules.get(ruleKey);

    if (!rule) {
      const isAllowed = await this.contract.isEndpointAllowed(endpoint, method);
      rule = { allowed: isAllowed, maxPerRequest: 0n };
      this.cachedRules.set(ruleKey, rule);
    }

    if (!rule.allowed) {
      return { allowed: false, reason: "endpoint blocked", amount, timestamp: Date.now() };
    }

    if (rule.maxPerRequest > 0n && amount > rule.maxPerRequest) {
      return { allowed: false, reason: "per-request cap exceeded", amount, timestamp: Date.now() };
    }

    try {
      const [ok, reasonBytes] = await this.contract.checkAndApprove(agent, endpoint, method, amount);
      const reason = ethers.toUtf8String(reasonBytes).replace(/\0/g, "");
      return { allowed: ok, reason, amount, timestamp: Date.now() };
    } catch (e: any) {
      return { allowed: false, reason: e.reason ?? "contract error", amount, timestamp: Date.now() };
    }
  }

  async getBudgetStatus(budgetId: bigint): Promise<BudgetStatus> {
    const [allocated, spent, remaining, active] = await this.contract.getBudgetStatus(budgetId);
    return { allocated, spent, remaining, active };
  }

  async getBudgetIdForAgent(agent: string): Promise<bigint | null> {
    try {
      return await this.contract.agentBudgetId(agent);
    } catch {
      return null;
    }
  }

  invalidateRule(endpoint: string, method: string): void {
    this.cachedRules.delete(`${endpoint}:${method}`);
  }
}
