export default class BatchedPool<T> {
  #queue: T[] = []
  #concurrencyAndSizes: number[]
  #processFunction: (batch: T[]) => Promise<void>

  #baseInterval: number
  #minInterval: number
  #maxInterval: number

  #processingLoop: Promise<void>
  #finished = false

  constructor(params: {
    concurrencyAndSizes: number[]
    maxWaitTime?: number
    processFunction: (batch: T[]) => Promise<void>
  }) {
    this.#concurrencyAndSizes = params.concurrencyAndSizes
    this.#baseInterval = Math.min(params.maxWaitTime ?? 200, 200) // Initial batch time (ms)
    this.#minInterval = Math.min(params.maxWaitTime ?? 100, 100) // Minimum batch time
    this.#maxInterval = Math.min(params.maxWaitTime ?? 3000, 3000) // Maximum batch time
    this.#processFunction = params.processFunction
    this.#processingLoop = this.#loop()
  }

  add(item: T): void {
    this.#queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.#queue.splice(0, Math.min(batchSize, this.#queue.length))
  }

  async #runWorker(batchSize: number) {
    let interval = this.#baseInterval
    while (!this.#finished || this.#queue.length > 0) {
      const startTime = performance.now()
      if (this.#queue.length > 0) {
        const batch = this.getBatch(batchSize)
        await this.#processFunction(batch)
      }
      //refigure interval
      const endTime = performance.now()
      const duration = endTime - startTime
      if (duration > interval || this.#queue.length === 0) {
        interval = Math.min(interval * 1.5, this.#maxInterval) // Increase if slow or empty
      } else {
        interval = Math.max(interval * 0.8, this.#minInterval) // Decrease if fast
      }
      if (this.#queue.length < batchSize / 2) {
        console.log(
          `pool(${batchSize}) is waiting ` +
            interval / 1000 +
            ' with queue size of ' +
            this.#queue.length
        )
        await this.#delay(interval)
      }
    }
  }

  async finish(): Promise<void> {
    this.#finished = true
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
