import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  private queue: T[] = []
  private batchSize: number
  private processFunction: (batch: T[]) => Promise<void>

  private baseInterval = 200 // Initial batch time (ms)
  private minInterval = 100 // Minimum batch time
  private maxInterval = 3000 // Maximum batch time
  private interval = this.baseInterval

  private processingLoop: Promise<void>
  private finished = false

  constructor(batchSize: number, processFunction: (batch: T[]) => Promise<void>) {
    this.batchSize = batchSize
    this.processFunction = processFunction
    this.processingLoop = this.#loop()
  }

  async finish(): Promise<void> {
    this.finished = true
    await this.processingLoop
  }

  add(item: T): void {
    this.queue.push(item)
  }

  getBatch(batchSize: number): T[] {
    return this.queue.splice(0, Math.min(batchSize, this.queue.length))
  }
  async #loop(): Promise<void> {
    while (!this.finished || this.queue.length > 0) {
      let wait = true
      if (this.queue.length > 0) {
        const startTime = performance.now()
        const batch = this.getBatch(this.batchSize)
        await this.processFunction(batch)
        //refigure interval
        const endTime = performance.now()
        wait = this.batchSize !== batch.length
        const duration = endTime - startTime
        if (duration > this.interval) {
          this.interval = Math.min(this.interval * 1.5, this.maxInterval) // Increase if slow
        } else {
          this.interval = Math.max(this.interval * 0.8, this.minInterval) // Decrease if fast
        }
      }
      if (wait) {
        await this.#delay(this.interval)
        //waited so reset
        this.interval = this.baseInterval
      }
    }
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
