export interface BudgetStatus {
  budgetId: string;
  allocated: string;
  spent: string;
  remaining: string;
  active: boolean;
}

export interface EndpointRule {
  address: string;
  method: string;
  allowed: boolean;
  maxPerRequest: string;
  maxPerHour: string;
  category: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  agent: string;
  action: "approved" | "denied" | "topped_up";
  endpoint: string;
  amount: string;
  reason: string;
  txHash: string | null;
}

export interface DashboardStats {
  budgetCount: number;
  totalApproved: string;
  totalDenied: string;
  approvalRate: number;
  avgSettlementMs: number;
  totalVolume24h: string;
}

export interface PreflightRequest {
  agent: string;
  endpoint: string;
  method?: string;
  amount?: string;
}

export interface PreflightResponse {
  allowed: boolean;
  reason: string;
  amount: string;
  timestamp: number;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  queueDepth: number;
}

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:3100";

async function fetchEngine<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ENGINE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export async function getBudget(agent: string): Promise<BudgetStatus> {
  return fetchEngine<BudgetStatus>(`/budget/${agent}`);
}

export async function getAllBudgets(agents: string[]): Promise<{ agent: string; budget: BudgetStatus }[]> {
  const results = await Promise.allSettled(agents.map((a) => getBudget(a)));
  return results
    .filter((r): r is PromiseFulfilledResult<BudgetStatus> => r.status === "fulfilled")
    .map((r, i) => ({ agent: agents[i], budget: r.value }));
}

export async function getPolicies(): Promise<EndpointRule[]> {
  return fetchEngine<EndpointRule[]>("/policies");
}

export async function getAuditLog(limit = 50): Promise<AuditEntry[]> {
  return fetchEngine<AuditEntry[]>(`/audit?limit=${limit}`);
}

export async function getStats(): Promise<DashboardStats> {
  return fetchEngine<DashboardStats>("/stats");
}

export async function preflight(req: PreflightRequest): Promise<PreflightResponse> {
  return fetchEngine<PreflightResponse>("/x402/preflight", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchEngine<HealthResponse>("/health");
}
