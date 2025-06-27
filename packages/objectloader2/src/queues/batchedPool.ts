import Queue from './queue.js'

export default class BatchedPool<T> implements Queue<T> {
  #queue: T[] = []
  #concurrencyAndSizes: number[]
  #processFunction: (batch: T[]) => Promise<void>

  #baseInterval: number

  #processingLoop: Promise<void>
  #disposed = false

  constructor(params: {
    concurrencyAndSizes: number[]
    maxWaitTime?: number
    processFunction: (batch: T[]) => Promise<void>
  }) {
    this.#concurrencyAndSizes = params.concurrencyAndSizes
    this.#baseInterval = Math.min(params.maxWaitTime ?? 200, 200) // Initial batch time (ms)
    this.#processFunction = params.processFunction
    this.#processingLoop = this.#loop()
  }

  add(item: T): void {
    this.#queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.#queue.splice(0, Math.min(batchSize, this.#queue.length))
  }

  async #runWorker(batchSize: number): Promise<void> {
    while (!this.#disposed || this.#queue.length > 0) {
      if (this.#queue.length > 0) {
        const batch = this.getBatch(batchSize)
        await this.#processFunction(batch)
      }
      await this.#delay(this.#baseInterval)
    }
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    await this.#processingLoop
  }

  async #loop(): Promise<void> {
    // Initialize workers
    const workers = Array.from(this.#concurrencyAndSizes, (batchSize: number) =>
      this.#runWorker(batchSize)
    )
    await Promise.all(workers)
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
