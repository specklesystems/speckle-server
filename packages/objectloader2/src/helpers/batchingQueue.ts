import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  #queue: T[] = []
  #batchSize: number
  #processFunction: (batch: T[]) => Promise<void>

  #baseInterval = 200 // Initial batch time (ms)
  #minInterval = 100 // Minimum batch time
  #maxInterval = 3000 // Maximum batch time

  #processingLoop: Promise<void>
  #finished = false

  constructor(batchSize: number, processFunction: (batch: T[]) => Promise<void>) {
    this.#batchSize = batchSize
    this.#processFunction = processFunction
    this.#processingLoop = this.#loop()
  }

  async finish(): Promise<void> {
    this.#finished = true
    await this.#processingLoop
  }

  add(item: T): void {
    this.#queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.#queue.splice(0, Math.min(batchSize, this.#queue.length))
  }
  async #loop(): Promise<void> {
    let interval = this.#baseInterval
    while (!this.#finished || this.#queue.length > 0) {
      let wait = true
      if (this.#queue.length > 0) {
        const startTime = performance.now()
        const batch = this.getBatch(this.#batchSize)
        await this.#processFunction(batch)
        //refigure interval
        const endTime = performance.now()
        wait = this.#batchSize !== batch.length
        const duration = endTime - startTime
        if (duration > interval) {
          interval = Math.min(interval * 1.5, this.#maxInterval) // Increase if slow
        } else {
          interval = Math.max(interval * 0.8, this.#minInterval) // Decrease if fast
        }
      }
      if (wait) {
        await this.#delay(interval)
        //waited so reset
        interval = this.#baseInterval
      }
    }
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
