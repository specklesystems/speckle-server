export default class BatchedPool<T> {
  private queue: T[] = []
  private concurrencyAndSizes: number[]
  private processFunction: (batch: T[]) => Promise<void>
  private workers: Promise<void>[] = []

  private baseInterval = 200 // Initial batch time (ms)
  private minInterval = 100 // Minimum batch time
  private maxInterval = 3000 // Maximum batch time

  private processingLoop: Promise<void>
  private finished = false

  constructor(
    concurrencyAndSizes: number[],
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.concurrencyAndSizes = concurrencyAndSizes
    this.processFunction = processFunction
    this.processingLoop = this.#loop()
  }

  add(item: T): void {
    this.queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.queue.splice(0, Math.min(batchSize, this.queue.length))
  }

  async #runWorker(batchSize: number) {
    let interval = this.baseInterval
    while (!this.finished || this.queue.length > 0) {
      let wait = true
      if (this.queue.length > 0) {
        const startTime = performance.now()
        const batch = this.getBatch(batchSize)
        await this.processFunction(batch)
        //refigure interval
        const endTime = performance.now()
        wait = batchSize !== batch.length
        const duration = endTime - startTime
        if (duration > interval) {
          interval = Math.min(interval * 1.5, this.maxInterval) // Increase if slow
        } else {
          interval = Math.max(interval * 0.8, this.minInterval) // Decrease if fast
        }
      }
      if (wait) {
        await this.#delay(interval)
        //waited so reset
        interval = this.baseInterval
      }
    }
  }

  async finish(): Promise<void> {
    this.finished = true
    await this.processingLoop
  }

  async #loop(): Promise<void> {
    // Initialize workers
    this.workers = Array.from(this.concurrencyAndSizes, (batchSize: number) =>
      this.#runWorker(batchSize)
    )
    await Promise.all(this.workers)
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
