import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import http from "http";

const TEST_PORT = 3199;
const ENGINE_URL = `http://localhost:${TEST_PORT}`;

function fetchEngine(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ENGINE_URL);
    const req = http.request(
      url,
      { method: init?.method ?? "GET", headers: { "Content-Type": "application/json" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (init?.body) req.write(init.body);
    req.end();
  });
}

function waitForEngine(url: string, maxRetries = 20): Promise<void> {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      tries++;
      http
        .get(`${url}/health`, (res) => {
          if (res.statusCode === 200) return resolve();
          if (tries < maxRetries) setTimeout(check, 500);
          else reject(new Error("engine never became healthy"));
        })
        .on("error", () => {
          if (tries < maxRetries) setTimeout(check, 500);
          else reject(new Error("engine never became reachable"));
        });
    };
    check();
  });
}

let engineProcess: ChildProcess | null = null;

describe("Pipeline Engine", () => {
  beforeAll(async () => {
    engineProcess = spawn("npx", ["tsx", "src/server.ts"], {
      env: { ...process.env, PORT: String(TEST_PORT), ARC_RPC_URL: process.env.ARC_RPC_URL ?? "http://localhost:8545", POLICY_ADDRESS: process.env.POLICY_ADDRESS ?? "" },
      stdio: "pipe",
      cwd: process.cwd(),
    });
    await waitForEngine(ENGINE_URL);
  }, 30000);

  afterAll(() => {
    if (engineProcess) {
      engineProcess.kill("SIGTERM");
    }
  });

  it("GET /health returns ok", async () => {
    const { status, body } = await fetchEngine("/health");
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
    expect(typeof body.uptime).toBe("number");
    expect(typeof body.queueDepth).toBe("number");
  });

  it("POST /x402/preflight rejects missing fields", async () => {
    const { status, body } = await fetchEngine("/x402/preflight", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(status).toBe(400);
    expect(body.allowed).toBe(false);
    expect(body.reason).toBe("missing agent or endpoint");
  });

  it("POST /x402/preflight validates populated request", async () => {
    const { status, body } = await fetchEngine("/x402/preflight", {
      method: "POST",
      body: JSON.stringify({
        agent: "0x0000000000000000000000000000000000000001",
        endpoint: "0x0000000000000000000000000000000000000002",
        method: "0x00000000",
        amount: "1000000",
      }),
    });
    expect([200, 403]).toContain(status);
    expect(typeof body.allowed).toBe("boolean");
    expect(typeof body.reason).toBe("string");
  });

  it("GET /audit returns array", async () => {
    const { status, body } = await fetchEngine("/audit");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /policies returns array", async () => {
    const { status, body } = await fetchEngine("/policies");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /stats returns numericals", async () => {
    const { status, body } = await fetchEngine("/stats");
    expect(status).toBe(200);
    expect(typeof body.approvalRate).toBe("number");
    expect(typeof body.totalApproved).toBe("string");
    expect(typeof body.totalDenied).toBe("string");
    expect(typeof body.totalVolume24h).toBe("string");
  });

  it("GET /budget/:agent returns 404 for unknown", async () => {
    const { status } = await fetchEngine("/budget/0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    expect(status).toBe(404);
  });
});
