"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { type BudgetStatus, type DashboardStats, type HealthResponse, getBudget, getStats, getHealth } from "@/lib/api";

const WATCHED_AGENTS = (process.env.NEXT_PUBLIC_WATCHED_AGENTS ?? "").split(",").filter(Boolean);

function formatUSDC(wei: string): string {
  const n = Number(wei) / 1_000_000;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const [budgets, setBudgets] = useState<{ agent: string; budget: BudgetStatus }[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [budgetResults, statsResult, healthResult] = await Promise.all([
          WATCHED_AGENTS.length > 0
            ? Promise.all(
                WATCHED_AGENTS.map(async (agent) => {
                  try { const b = await getBudget(agent); return { agent, budget: b }; }
                  catch { return null; }
                })
              ).then((res) => res.filter((r): r is NonNullable<typeof r> => r !== null))
            : Promise.resolve([]),
          getStats().catch(() => null),
          getHealth().catch(() => null),
        ]);
        setBudgets(budgetResults);
        setStats(statsResult);
        setHealth(healthResult);
      } catch (e) {
        setError(e instanceof Error ? e.message : "failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <nav className="nav" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/" className="nav-home">Pipeline</Link>
        <div style={{ display: "flex", gap: "var(--space-6)" }}>
          <Link href="/" style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>Home</Link>
          <Link href="/policies" style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>Policies</Link>
          <Link href="/audit" style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>Audit</Link>
        </div>
      </nav>

      <div className="page">
        <header className="header">
          <div>
            <h1>Dashboard</h1>
            <p className="sub">
              {health
                ? `engine ok · ${health.queueDepth} entries in audit log`
                : "connecting to engine..."}
            </p>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--muted)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: health ? "var(--success)" : "var(--warn)", display: "inline-block" }} />
            {health ? "Arc testnet" : "offline"}
          </span>
        </header>

        {loading ? (
          <div className="loading"><div className="spinner" /> loading budgets</div>
        ) : error ? (
          <div className="table-wrap">
            <div className="empty-state">
              <p>{error}</p>
              <p style={{ fontSize: 11, marginTop: 8 }}>
                set NEXT_PUBLIC_WATCHED_AGENTS and NEXT_PUBLIC_ENGINE_URL to connect
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-card">
                <p className="label">Budgets</p>
                <p className="value">{stats ? stats.budgetCount : budgets.length}</p>
              </div>
              <div className="stat-card">
                <p className="label">Approved (24h)</p>
                <p className="value">{stats ? formatUSDC(stats.totalApproved) : "--"}</p>
              </div>
              <div className="stat-card">
                <p className="label">Denied (24h)</p>
                <p className="value">{stats ? formatUSDC(stats.totalDenied) : "--"}</p>
              </div>
              <div className="stat-card">
                <p className="label">Approval Rate</p>
                <p className="value">{stats ? `${(stats.approvalRate * 100).toFixed(1)}%` : "--"}</p>
              </div>
              <div className="stat-card">
                <p className="label">Avg Settlement</p>
                <p className="value">{stats?.avgSettlementMs ? `${stats.avgSettlementMs}ms` : "--"}</p>
              </div>
            </div>

            {budgets.length > 0 && (
              <section className="section-block">
                <div className="section-header">
                  <h2 className="section-title">Agent Budgets</h2>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{budgets.length} agent{budgets.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Agent</th>
                        <th>Budget ID</th>
                        <th>Allocated</th>
                        <th>Spent</th>
                        <th>Remaining</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map(({ agent, budget }) => (
                        <tr key={agent}>
                          <td className="mono" title={agent}>{truncate(agent)}</td>
                          <td className="mono">{budget.budgetId}</td>
                          <td>{formatUSDC(budget.allocated)}</td>
                          <td>{formatUSDC(budget.spent)}</td>
                          <td>{formatUSDC(budget.remaining)}</td>
                          <td>
                            <span className={`badge ${budget.active ? (Number(budget.remaining) === 0 ? "badge-exhausted" : "badge-active") : "badge-blocked"}`}>
                              {!budget.active ? "disabled" : Number(budget.remaining) === 0 ? "exhausted" : "active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {budgets.length === 0 && (
              <div className="table-wrap">
                <div className="empty-state">
                  <p>no agent budgets tracked</p>
                  <p style={{ fontSize: 11, marginTop: 8 }}>
                    set NEXT_PUBLIC_WATCHED_AGENTS to a comma-separated list of agent addresses
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
