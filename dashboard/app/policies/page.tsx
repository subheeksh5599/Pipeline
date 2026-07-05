"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPolicies, type EndpointRule } from "@/lib/api";

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUSDC(wei: string): string {
  const n = Number(wei) / 1_000_000;
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

export default function PoliciesPage() {
  const [rules, setRules] = useState<EndpointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies()
      .then(setRules)
      .catch((e) => setError(e instanceof Error ? e.message : "failed to fetch"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /> loading policies</div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Endpoint Policies</h1>
          <p className="sub">x402 endpoint access rules for agent spending</p>
        </div>
        <Link href="/" className="btn">Overview</Link>
      </header>

      <section className="section-block">
        <div className="section-header">
          <h2 className="section-title">Active Rules</h2>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>{rules.length} rule{rules.length !== 1 ? "s" : ""}</span>
        </div>

        {error ? (
          <div className="table-wrap">
            <div className="empty-state"><p>{error}</p></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state"><p>no endpoint rules configured</p></div>
          </div>
        ) : (
          <div className="rule-grid">
            {rules.map((rule) => (
              <div className="rule-card" key={`${rule.address}-${rule.method}`}>
                <div className="rule-header">
                  <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{rule.category}</span>
                  <span className={`badge ${rule.allowed ? "badge-active" : "badge-blocked"}`}>{rule.allowed ? "allowed" : "blocked"}</span>
                </div>
                <p className="rule-endpoint" title={rule.address}>{rule.address}</p>
                <p className="rule-meta">
                  {rule.method} · max {formatUSDC(rule.maxPerRequest)}/req · {formatUSDC(rule.maxPerHour)}/hr
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2 className="section-title" style={{ marginBottom: "var(--space-4)" }}>Add Rule</h2>
        <form onSubmit={(e) => e.preventDefault()} style={{ maxWidth: 480 }}>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Endpoint Address</label>
              <input type="text" placeholder="0x0000000000000000000000000000000000000000" />
            </div>
            <div className="form-group">
              <label>Method Selector</label>
              <input type="text" placeholder="0x00000000" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select>
                <option>content</option>
                <option>streaming</option>
                <option>api</option>
                <option>compute</option>
                <option>blocked</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Per Request (USDC)</label>
              <input type="text" placeholder="50" />
            </div>
            <div className="form-group">
              <label>Max Per Hour (USDC)</label>
              <input type="text" placeholder="500" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-primary">Allow Endpoint</button>
            <button type="button" className="btn btn-danger">Block Endpoint</button>
          </div>
        </form>
      </section>

      <footer className="footer">
        <span>Pipeline · Lepton Agents Hackathon</span>
        <span>Arc testnet</span>
      </footer>
    </div>
  );
}
