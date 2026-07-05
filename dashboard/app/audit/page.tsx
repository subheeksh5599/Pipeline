"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuditLog, getStats, type AuditEntry, type DashboardStats } from "@/lib/api";

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUSDC(wei: string): string {
  const n = Number(wei) / 1_000_000;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(6)}`;
}

function actionClass(action: string): string {
  if (action === "approved") return "activity-action-approve";
  if (action === "denied") return "activity-action-deny";
  return "activity-action-topup";
}

export default function AuditPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAuditLog(50), getStats().catch(() => null)])
      .then(([log, s]) => {
        setAuditLog(log);
        setStats(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "failed to fetch"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /> loading audit log</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Audit Log</h1>
          <p className="sub">every approval and denial, timestamped and committed onchain</p>
        </div>
        <Link href="/" className="btn">Overview</Link>
      </header>

      <div className="stats-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="stat-card">
          <p className="label">Total Txns</p>
          <p className="value" style={{ fontSize: "var(--text-xl)" }}>{auditLog.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Approval Rate</p>
          <p className="value" style={{ fontSize: "var(--text-xl)", color: stats && stats.approvalRate < 0.9 ? "var(--warn)" : "var(--success)" }}>
            {stats ? `${(stats.approvalRate * 100).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="stat-card">
          <p className="label">Avg Settlement</p>
          <p className="value" style={{ fontSize: "var(--text-xl)" }}>{stats ? `${stats.avgSettlementMs}ms` : "—"}</p>
        </div>
        <div className="stat-card">
          <p className="label">Volume (24h)</p>
          <p className="value" style={{ fontSize: "var(--text-xl)" }}>{stats ? formatUSDC(stats.totalVolume24h) : "—"}</p>
        </div>
      </div>

      {error ? (
        <div className="table-wrap">
          <div className="empty-state"><p>{error}</p></div>
        </div>
      ) : auditLog.length === 0 ? (
        <div className="table-wrap">
          <div className="empty-state"><p>no audit entries yet</p></div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Agent</th>
                <th>Action</th>
                <th>Endpoint</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{entry.timestamp}</td>
                  <td className="mono">{truncate(entry.agent)}</td>
                  <td><span className={actionClass(entry.action)}>{entry.action}</span></td>
                  <td style={{ fontSize: 11, color: "var(--fg-2)" }}>{entry.endpoint === "—" ? "—" : truncate(entry.endpoint)}</td>
                  <td className="mono" style={{ fontSize: "var(--text-xs)" }}>{formatUSDC(entry.amount)}</td>
                  <td style={{ fontSize: 11, color: entry.action === "denied" ? "var(--danger)" : "var(--muted)" }}>{entry.reason}</td>
                  <td className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{entry.txHash ? truncate(entry.txHash) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="footer">
        <span>Pipeline · Lepton Agents Hackathon</span>
        <span>Arc testnet</span>
      </footer>
    </div>
  );
}
