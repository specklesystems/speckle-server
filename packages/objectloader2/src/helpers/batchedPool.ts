export default class BatchedPool<T> {
  private queue: T[] = []
  private concurrencyAndSizes: number[]
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>
  private workers: Promise<void>[] = []

  private processingLoop: Promise<void>
  private finished = false

  constructor(
    concurrencyAndSizes: number[],
    batchTime: number,
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.concurrencyAndSizes = concurrencyAndSizes
    this.batchTime = batchTime
    this.processFunction = processFunction
    this.processingLoop = this.loop()
  }

  add(item: T): void {
    this.queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.queue.splice(0, Math.min(batchSize, this.queue.length))
  }

  private async runWorker(batchSize: number) {
    while (!this.finished || this.queue.length > 0) {
      if (this.queue.length > 0) {
        const batch = this.getBatch(batchSize)
        await this.processFunction(batch)
      } else {
        await this.delay(this.batchTime)
      }
    }
  }

  async finish(): Promise<void> {
    this.finished = true
    await this.processingLoop
  }

  async loop() {
    // Initialize workers
    this.workers = Array.from(this.concurrencyAndSizes, (batchSize: number) =>
      this.runWorker(batchSize)
    )
    await Promise.all(this.workers)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
