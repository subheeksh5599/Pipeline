export interface BatchEntry {
  agent: string;
  endpoint: string;
  method: string;
  amount: string;
  approved: boolean;
  txHash?: string;
}

export class BatchQueue {
  private queue: BatchEntry[];
  private flushInterval: number;
  private maxBatchSize: number;
  private timer: ReturnType<typeof setInterval> | null;
  private onFlush: (batch: BatchEntry[]) => Promise<void>;

  constructor(onFlush: (batch: BatchEntry[]) => Promise<void>, intervalMs = 5000, maxSize = 100) {
    this.queue = [];
    this.flushInterval = intervalMs;
    this.maxBatchSize = maxSize;
    this.onFlush = onFlush;
    this.timer = null;
  }

  start(): void {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  enqueue(entry: BatchEntry): void {
    this.queue.push(entry);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    await this.onFlush(batch);
  }

  get length(): number {
    return this.queue.length;
  }
}
