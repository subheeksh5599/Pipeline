import { ethers } from "ethers";
import { PolicyResolver } from "./policy-resolver";
import { RateLimiter } from "./rate-limiter";

export interface OutcomeGateConfig {
  bondId: bigint;
  budgetId: bigint;
  nextTrancheAmount: bigint;
  contract: ethers.Contract;
}

export class OutcomeGater {
  async shouldRelease(config: OutcomeGateConfig): Promise<{ shouldRelease: boolean; amount: bigint; reason: string }> {
    try {
      const bond = await config.contract.outcomeBonds(config.bondId);
      if (!bond.resolved) {
        return { shouldRelease: false, amount: 0n, reason: "bond unresolved" };
      }
      if (!bond.delivered) {
        return { shouldRelease: false, amount: 0n, reason: "bond resolved as not delivered" };
      }
      return { shouldRelease: true, amount: config.nextTrancheAmount, reason: "outcome verified" };
    } catch (e: any) {
      return { shouldRelease: false, amount: 0n, reason: `contract error: ${e.reason ?? "unknown"}` };
    }
  }

  async releaseIfReady(config: OutcomeGateConfig): Promise<{ released: boolean; txHash?: string }> {
    const verdict = await this.shouldRelease(config);
    if (!verdict.shouldRelease) return { released: false };

    try {
      const tx = await config.contract.releaseTranche(config.budgetId, config.nextTrancheAmount);
      const receipt = await tx.wait();
      return { released: true, txHash: receipt.hash };
    } catch {
      return { released: false };
    }
  }
}
