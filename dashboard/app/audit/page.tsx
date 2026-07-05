export default function AuditPage() {
  return (
    <div className="page">
      <header style={{ marginBottom: 32 }}>
        <h2 className="section-title">Audit Log</h2>
        <p style={{ color: "#71717a", fontSize: 13, marginTop: 4 }}>
          Every approval and denial, timestamped and committed onchain on Arc.
        </p>
      </header>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ flex: 1, padding: 16 }}>
          <p className="label">Total Transactions</p><p className="value" style={{ fontSize: 20 }}>1,247</p>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: 16 }}>
          <p className="label">Approval Rate</p><p className="value" style={{ fontSize: 20, color: "#4ade80" }}>94.2%</p>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: 16 }}>
          <p className="label">Avg Settlement</p><p className="value" style={{ fontSize: 20 }}>412ms</p>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: 16 }}>
          <p className="label">Total Volume (24h)</p><p className="value" style={{ fontSize: 20 }}>$1,575.32</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th><th>Agent</th><th>Action</th><th>Endpoint</th><th>Amount</th><th>Reason</th><th>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {[
              { ts: "2026-07-05 14:23:01", agent: "0x1a2b...0a0b", action: "approved", endpoint: "x402://rsshub/feed", amount: "$0.0012", reason: "—", tx: "0xabc1...def2" },
              { ts: "2026-07-05 14:22:45", agent: "0x1a2b...0a0b", action: "approved", endpoint: "x402://rsshub/feed", amount: "$0.0008", reason: "—", tx: "0xabc2...def3" },
              { ts: "2026-07-05 14:22:18", agent: "0x9a0b...6f7a", action: "denied", endpoint: "x402://llm-agent/proxy", amount: "$2.50", reason: "endpoint blocked", tx: "—" },
              { ts: "2026-07-05 14:19:52", agent: "0x5e6f...2d3e", action: "approved", endpoint: "x402://owncast/stream", amount: "$0.003", reason: "—", tx: "0xabc3...def4" },
              { ts: "2026-07-05 14:15:30", agent: "0x1a2b...0a0b", action: "denied", endpoint: "x402://rsshub/feed", amount: "$0.025", reason: "per-request cap exceeded", tx: "—" },
              { ts: "2026-07-05 14:10:01", agent: "0x1a2b...0a0b", action: "topped up", endpoint: "—", amount: "+$1,000", reason: "guardian action", tx: "0xabc4...def5" },
              { ts: "2026-07-05 13:55:12", agent: "0x5e6f...2d3e", action: "denied", endpoint: "x402://owncast/stream", amount: "$0.15", reason: "budget exceeded", tx: "—" },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontSize: 11, color: "#71717a" }}>{row.ts}</td>
                <td style={{ fontSize: 11 }}>{row.agent}</td>
                <td>
                  <span className={`action-${row.action === "approved" ? "approve" : row.action === "denied" ? "deny" : "topup"}`}>
                    {row.action}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: "#a1a1aa" }}>{row.endpoint}</td>
                <td style={{ fontSize: 13 }}>{row.amount}</td>
                <td style={{ fontSize: 11, color: row.reason === "—" ? "#71717a" : "#f87171" }}>{row.reason}</td>
                <td style={{ fontSize: 10, color: "#71717a" }}>{row.tx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
