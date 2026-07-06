import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="nav top-nav">
        <Link href="/" className="nav-home">Pipeline</Link>
        <div className="nav-links">
          <a href="https://github.com/subheeksh5599/Pipeline">GitHub</a>
        </div>
      </header>

      <section className="hero">
        <h1>Spending governance for AI agents</h1>
        <p className="hero-lede">
          Circle gives agents wallets. x402 gives them things to buy.
          Pipeline is the layer between them — budgets, rate limits,
          endpoint ACLs — enforced onchain on Arc.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          <a href="https://github.com/subheeksh5599/Pipeline" className="btn">Source</a>
        </div>
      </section>

      <section className="block">
        <div className="grid-3">
          <div className="card">
            <p className="card-num">1</p>
            <p className="card-title">Budget</p>
            <p className="card-body">Set a spending cap per agent. Pipeline denies any request that exceeds it and logs the reason onchain.</p>
          </div>
          <div className="card">
            <p className="card-num">2</p>
            <p className="card-title">Control</p>
            <p className="card-body">Per-endpoint allowlists, per-request caps, per-hour rate limits. Every rule lives in PipelinePolicy.sol on Arc.</p>
          </div>
          <div className="card">
            <p className="card-num">3</p>
            <p className="card-title">Audit</p>
            <p className="card-body">Every approval and denial is timestamped with a tx hash. A human operator sees the dashboard in real time.</p>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>How it works</h2>
        <div className="flow-simple">
          <div className="flow-node">
            <span className="flow-dot" />
            <div>
              <strong>Agent attempts to spend</strong>
              <p>x402 preflight hits Pipeline before any USDC moves</p>
            </div>
          </div>
          <div className="flow-line" />
          <div className="flow-node">
            <span className="flow-dot accent-dot" />
            <div>
              <strong>Pipeline checks the policy</strong>
              <p>Budget - allowlist - cap - rate limit — under 100ms</p>
            </div>
          </div>
          <div className="flow-line split-line">
            <span className="split-left" />
            <span className="split-right" />
          </div>
          <div className="flow-row-split">
            <div className="flow-node half">
              <span className="flow-dot success-dot" />
              <div>
                <strong style={{ color: "var(--success)" }}>Approved</strong>
                <p>Settles on Arc via Gateway in under 500ms</p>
              </div>
            </div>
            <div className="flow-node half">
              <span className="flow-dot danger-dot" />
              <div>
                <strong style={{ color: "var(--danger)" }}>Denied</strong>
                <p>Logged with reason. Operator alerted.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <h2>Circle primitives</h2>
        <div className="grid-3 grid-tight">
          <div className="card tight"><p className="card-label">Wallets</p><p className="card-body">Embed agent wallets with automated key management</p></div>
          <div className="card tight"><p className="card-label">x402</p><p className="card-body">Pay-per-request HTTP 402 protocol</p></div>
          <div className="card tight"><p className="card-label">Gateway</p><p className="card-body">Gasless nanopayments down to $0.000001</p></div>
          <div className="card tight"><p className="card-label">Contracts</p><p className="card-body">Onchain audit trail on Arc</p></div>
          <div className="card tight"><p className="card-label">App Kit</p><p className="card-body">Unified Balance, Bridge, Swap</p></div>
          <div className="card tight"><p className="card-label">Arc</p><p className="card-body">Sub-500ms · native USDC gas</p></div>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <p className="footer-name">Pipeline</p>
          <p>Lepton Agents Hackathon · Canteen &times; Circle &times; Arc</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/subheeksh5599/Pipeline">GitHub</a>
          <Link href="/policies">Policies</Link>
          <Link href="/audit">Audit</Link>
        </div>
      </footer>
    </div>
  );
}
