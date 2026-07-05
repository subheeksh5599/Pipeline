export interface RateLimitBucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  lastRefill: number;
  category: string;
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket>;

  constructor() {
    this.buckets = new Map();
  }

  configure(category: string, capacity: number, refillRatePerMinute: number): void {
    this.buckets.set(category, {
      tokens: capacity,
      capacity,
      refillRate: refillRatePerMinute,
      lastRefill: Date.now(),
      category,
    });
  }

  allow(agent: string, category: string, cost: number = 1): { allowed: boolean; retryAfterMs: number } {
    const key = `${agent}:${category}`;
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: 100, capacity: 100, refillRate: 100, lastRefill: Date.now(), category };
      this.buckets.set(key, bucket);
    }

    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    const refill = Math.floor(elapsed * (bucket.refillRate / 60));

    if (refill > 0) {
      bucket.tokens = Math.min(bucket.capacity, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { allowed: true, retryAfterMs: 0 };
    }

    const retryMs = Math.ceil(((cost - bucket.tokens) / bucket.refillRate) * 60 * 1000);
    return { allowed: false, retryAfterMs: retryMs };
  }

  remaining(agent: string, category: string): number {
    const key = `${agent}:${category}`;
    return this.buckets.get(key)?.tokens ?? 0;
  }
}
