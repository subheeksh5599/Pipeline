export default function DashboardPage() {
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Pipeline</h1>
          <p>programmable spending for AI agents</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="status-dot">Arc testnet</span>
          <button className="btn">Connect Wallet</button>
        </div>
      </header>

      <div className="stats">
        <div className="stat-card"><p className="label">Total Budgets</p><p className="value">3</p></div>
        <div className="stat-card"><p className="label">Spend Approved (24h)</p><p className="value">$1,247.82</p></div>
        <div className="stat-card"><p className="label">Spend Denied (24h)</p><p className="value">$327.50</p></div>
      </div>

      <section style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="section-title">Agent Budgets</h2>
          <button className="btn">+ New Budget</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th><th>Allocated</th><th>Spent</th><th>Remaining</th><th>Rate Limit</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontSize: 11 }}>0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b</td>
                <td>$5,000</td><td>$1,247</td><td>$3,753</td><td>$100/hr</td>
                <td><span className="badge badge-active">active</span></td>
              </tr>
              <tr>
                <td style={{ fontSize: 11 }}>0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e</td>
                <td>$2,500</td><td>$892</td><td>$1,608</td><td>$50/hr</td>
                <td><span className="badge badge-active">active</span></td>
              </tr>
              <tr>
                <td style={{ fontSize: 11 }}>0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a</td>
                <td>$1,000</td><td>$1,000</td><td>$0</td><td>$200/hr</td>
                <td><span className="badge badge-exhausted">exhausted</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="section-title">Endpoint Rules</h2>
        <div className="rule-grid">
          <div className="rule-card">
            <div className="rule-header">
              <span style={{ fontSize: 11, color: "#71717a" }}>Endpoint</span>
              <span className="badge badge-active">allowed</span>
            </div>
            <p className="rule-endpoint">x402://rsshub/feed</p>
            <p className="rule-meta">0xfeedfeed · content · max $50/req</p>
          </div>
          <div className="rule-card">
            <div className="rule-header">
              <span style={{ fontSize: 11, color: "#71717a" }}>Endpoint</span>
              <span className="badge badge-active">allowed</span>
            </div>
            <p className="rule-endpoint">x402://owncast/stream</p>
            <p className="rule-meta">0xstream01 · streaming · max $10/req</p>
          </div>
          <div className="rule-card">
            <div className="rule-header">
              <span style={{ fontSize: 11, color: "#71717a" }}>Endpoint</span>
              <span className="badge badge-exhausted">blocked</span>
            </div>
            <p className="rule-endpoint">x402://llm-agent/proxy</p>
            <p className="rule-meta">0x00000000 · blocked · $0 max</p>
          </div>
        </div>
      </section>

      <section className="activity">
        <h2 className="section-title">Recent Activity</h2>
        <div className="table-wrap">
          <div className="entry"><span className="time">2s ago</span><span className="agent">0x1a2b...0a0b</span><span className="action-approve">approved</span><span className="endpoint">x402://rsshub/feed</span><span className="amount">$0.0012</span></div>
          <div className="entry"><span className="time">18s ago</span><span className="agent">0x1a2b...0a0b</span><span className="action-approve">approved</span><span className="endpoint">x402://rsshub/feed</span><span className="amount">$0.0008</span></div>
          <div className="entry"><span className="time">45s ago</span><span className="agent">0x9a0b...6f7a</span><span className="action-deny">denied</span><span className="endpoint">x402://llm-agent/proxy</span><span className="amount">$2.50</span></div>
          <div className="entry"><span className="time">2m ago</span><span className="agent">0x5e6f...2d3e</span><span className="action-approve">approved</span><span className="endpoint">x402://owncast/stream</span><span className="amount">$0.003</span></div>
          <div className="entry"><span className="time">5m ago</span><span className="agent">0x1a2b...0a0b</span><span className="action-topup">topped up</span><span className="endpoint">—</span><span className="amount">+$1,000</span></div>
        </div>
      </section>
    </div>
  );
}
