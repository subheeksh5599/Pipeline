export default function PoliciesPage() {
  return (
    <div className="page">
      <header style={{ marginBottom: 32 }}>
        <h2 className="section-title">Endpoint Policies</h2>
        <p style={{ color: "#71717a", fontSize: 13, marginTop: 4 }}>
          Configure which x402 endpoints your agents can spend at, with per-request and per-hour caps.
        </p>
      </header>

      <section className="form-section">
        <h3 style={{ fontSize: 14, marginBottom: 16 }}>Add Rule</h3>
        <div className="form-group">
          <label>Endpoint Address</label>
          <input type="text" placeholder="0x..." />
        </div>
        <div className="form-group">
          <label>Method Selector (bytes4)</label>
          <input type="text" placeholder="0x00000000" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, maxWidth: 400 }}>
          <div className="form-group">
            <label>Max Per Request (USDC)</label>
            <input type="text" placeholder="50" />
          </div>
          <div className="form-group">
            <label>Max Per Hour (USDC)</label>
            <input type="text" placeholder="500" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select>
              <option>content</option>
              <option>streaming</option>
              <option>api</option>
              <option>compute</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" style={{ background: "#2563eb", borderColor: "#2563eb" }}>Allow Endpoint</button>
          <button className="btn" style={{ color: "#f87171" }}>Block Endpoint</button>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14 }}>Active Rules</h3>
          <span style={{ fontSize: 12, color: "#71717a" }}>3 rules</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th><th>Method</th><th>Status</th><th>Max/Req</th><th>Max/Hr</th><th>Category</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontSize: 11 }}>0xfeed...feed</td><td>0xfeedfeed</td>
                <td><span className="badge badge-active">allowed</span></td>
                <td>$50</td><td>$500</td><td>content</td>
                <td><button className="btn" style={{ fontSize: 11, padding: "4px 8px", color: "#f87171" }}>Revoke</button></td>
              </tr>
              <tr>
                <td style={{ fontSize: 11 }}>0xstre...am01</td><td>0xstream01</td>
                <td><span className="badge badge-active">allowed</span></td>
                <td>$10</td><td>$200</td><td>streaming</td>
                <td><button className="btn" style={{ fontSize: 11, padding: "4px 8px", color: "#f87171" }}>Revoke</button></td>
              </tr>
              <tr>
                <td style={{ fontSize: 11 }}>0xllma...oxy0</td><td>0x00000000</td>
                <td><span className="badge badge-exhausted">blocked</span></td>
                <td>$0</td><td>$0</td><td>blocked</td>
                <td><button className="btn" style={{ fontSize: 11, padding: "4px 8px" }}>Allow</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
