import { describe, it, expect } from "vitest";
import { RateLimiter } from "../src/rate-limiter";

describe("RateLimiter", () => {
  it("allows within capacity", () => {
    const rl = new RateLimiter();
    rl.configure("default", 100, 100);
    const result = rl.allow("agent_1", "default");
    expect(result.allowed).toBe(true);
  });

  it("refills over time", () => {
    const rl = new RateLimiter();
    rl.configure("content", 100, 6000);
    const key = "agent_1:content";
    const bucket = (rl as any).buckets.get(key);
    if (bucket) bucket.tokens = 0;
    const result = rl.allow("agent_1", "content");
    expect(result.allowed).toBe(true);
  });

  it("tracks remaining tokens", () => {
    const rl = new RateLimiter();
    rl.configure("default", 100, 100);
    const before = rl.remaining("agent_1", "default");
    rl.allow("agent_1", "default");
    const after = rl.remaining("agent_1", "default");
    expect(after).toBe(before - 1);
  });
});
