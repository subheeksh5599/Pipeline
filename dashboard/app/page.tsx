import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── hero ──────────────────────────────────────────────────────── */}
      <section className="hero">
        <span className="hero-tag">Lepton Agents Hackathon · Canteen × Circle × Arc</span>
        <h1>
          Pipeline
          <span className="hero-sub">the programmable spending engine for AI agents</span>
        </h1>
        <p className="hero-lede">
          Give an agent a wallet and it will drain you. Pipeline sits between every Circle
          wallet and every x402 endpoint, governing every cent an agent spends — budgets,
          rate limits, endpoint ACLs, and outcome-gated tranches — enforced onchain on Arc
          with sub-second finality and gasless settlement through Gateway.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          <a href="https://github.com/subheeksh5599/Pipeline" className="btn">GitHub</a>
        </div>
      </section>

      {/* ── problem ────────────────────────────────────────────────────── */}
      <section className="block">
        <h2>The gap no one filled</h2>
        <div className="grid-2">
          <div className="card">
            <p className="card-label">Circle gives agents wallets</p>
            <p className="card-body">The Agent Stack embeds USDC spending into any AI agent. It can pay, receive, stream, and settle on Arc in under half a second.</p>
          </div>
          <div className="card">
            <p className="card-label">x402 gives them things to buy</p>
            <p className="card-body">The HTTP 402 Payment Required standard wraps any API, article, or stream in a paywall. Agents discover and pay per request.</p>
          </div>
          <div className="card accent-card">
            <p className="card-label">Pipeline governs the spend between them</p>
            <p className="card-body">No one built the control plane. An agent with unrestricted spending authority is not autonomous — it is ungoverned. Pipeline adds budgets, rate limits, endpoint blocklists, and outcome-gated tranches. Every approval and denial is audited onchain.</p>
          </div>
        </div>
      </section>

      {/* ── how it works ────────────────────────────────────────────────── */}
      <section className="block">
        <h2>How it works</h2>
        <div className="flow">
          <div className="flow-row">
            <span className="flow-step">1</span>
            <div>
              <strong>Agent hits an x402 endpoint</strong>
              <p>An AI agent attempts to pay for an API call, article, or stream. Before USDC moves, the request hits Pipeline.</p>
            </div>
          </div>
          <div className="flow-arrow">
            <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="var(--border)" strokeWidth="2" strokeDasharray="2 4"/></svg>
          </div>
          <div className="flow-row">
            <span className="flow-step">2</span>
            <div>
              <strong>Pipeline runs policy checks in under 100ms</strong>
              <p>Budget allocation &rarr; endpoint allowlist &rarr; per-request cap &rarr; hourly rate limit &rarr; outcome gate. Every rule lives onchain in <code>PipelinePolicy.sol</code>.</p>
            </div>
          </div>
          <div className="flow-arrow">
            <svg width="2" height="32" viewBox="0 0 2 32"><line x1="1" y1="0" x2="1" y2="32" stroke="var(--border)" strokeWidth="2" strokeDasharray="2 4"/></svg>
          </div>
          <div className="flow-row">
            <span className="flow-step split">3a</span>
            <div>
              <strong>Approved</strong>
              <p>USDC settles on Arc in under 500ms via Gateway gasless batching. The audit log records the approval with a tx hash.</p>
            </div>
          </div>
          <div className="flow-row">
            <span className="flow-step split deny">3b</span>
            <div>
              <strong>Denied</strong>
              <p>The rejection is logged with a reason code — &ldquo;budget exceeded,&rdquo; &ldquo;endpoint blocked,&rdquo; &ldquo;rate limited.&rdquo; The operator gets a dashboard alert.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── stack ──────────────────────────────────────────────────────── */}
      <section className="block">
        <h2>Circle primitives in use</h2>
        <div className="grid-3">
          <div className="card">
            <p className="card-label">Wallets</p>
            <p className="card-body">Every agent gets a Circle wallet. Pipeline governs what that wallet can spend, where, and how fast.</p>
          </div>
          <div className="card">
            <p className="card-label">x402 Protocol</p>
            <p className="card-body">The pre-flight hook intercepts x402 payment requests before they route through — approve or deny in under 100ms.</p>
          </div>
          <div className="card">
            <p className="card-label">Gateway</p>
            <p className="card-body">Nanopayments as small as $0.000001, gas-free via batched transactions. Pipeline aggregates approvals into single Gateway batches.</p>
          </div>
          <div className="card">
            <p className="card-label">Contracts</p>
            <p className="card-body">PipelinePolicy.sol stores budgets, endpoint rules, and outcome bonds onchain on Arc — a verifiable audit trail.</p>
          </div>
          <div className="card">
            <p className="card-label">App Kit</p>
            <p className="card-body">Unified Balance for cross-category spend tracking. Cross-chain routing through Bridge + Swap composition.</p>
          </div>
          <div className="card">
            <p className="card-label">Arc</p>
            <p className="card-body">Sub-500ms settlement. Native USDC gas. The only L1 where sub-cent agent payments are economical.</p>
          </div>
        </div>
      </section>

      {/* ── moat ────────────────────────────────────────────────────────── */}
      <section className="block">
        <h2>Why this is a monopoly play</h2>
        <div className="grid-2">
          <div className="card">
            <p className="card-label">Switch cost</p>
            <p className="card-body">An agent&rsquo;s spending policy lives in the PipelinePolicy contract. Moving it means rewriting the entire budget logic from scratch. Policies compound — the more rules an agent accumulates, the stickier Pipeline gets.</p>
          </div>
          <div className="card">
            <p className="card-label">Network position</p>
            <p className="card-body">Pipeline sits between every Circle wallet and every x402 endpoint. All agent spend routes through it. Once other contracts integrate against Pipeline&rsquo;s approval API, it becomes infrastructure.</p>
          </div>
        </div>
      </section>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div>
          <p className="footer-name">Pipeline</p>
          <p>Lepton Agents Hackathon · Canteen &times; Circle &times; Arc · 2026</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/subheeksh5599/Pipeline">GitHub</a>
          <Link href="/policies">Policies</Link>
          <Link href="/audit">Audit Log</Link>
        </div>
      </footer>
    </div>
  );
}
