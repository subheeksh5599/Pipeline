import { describe, it, expect, vi } from "vitest";
import { BatchQueue } from "../src/batch-queue";

describe("BatchQueue", () => {
  it("flushes when batch size reached", async () => {
    const flushFn = vi.fn().mockResolvedValue(undefined);
    const q = new BatchQueue(flushFn, 60000, 3);

    q.enqueue({ agent: "0xa", endpoint: "0xb", method: "0x0", amount: "100", approved: true });
    q.enqueue({ agent: "0xa", endpoint: "0xb", method: "0x0", amount: "200", approved: true });
    q.enqueue({ agent: "0xa", endpoint: "0xc", method: "0x0", amount: "300", approved: false });

    await vi.waitFor(() => expect(flushFn).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(q.length).toBe(0);

    q.stop();
  });

  it("tracks queue length", () => {
    const flushFn = vi.fn().mockResolvedValue(undefined);
    const q = new BatchQueue(flushFn, 60000, 100);

    expect(q.length).toBe(0);
    q.enqueue({ agent: "0xa", endpoint: "0xb", method: "0x0", amount: "100", approved: true });
    expect(q.length).toBe(1);

    q.stop();
  });
});
