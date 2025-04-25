import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  #queue: T[] = []
  #batchSize: number
  #processFunction: (batch: T[]) => Promise<void>

  #baseInterval: number
  #minInterval: number
  #maxInterval: number

  #processingLoop: Promise<void>
  #finished = false

  constructor(params: {
    batchSize: number
    maxWaitTime?: number
    processFunction: (batch: T[]) => Promise<void>
  }) {
    this.#batchSize = params.batchSize
    this.#baseInterval = Math.min(params.maxWaitTime ?? 200, 200) // Initial batch time (ms)
    this.#minInterval = Math.min(params.maxWaitTime ?? 100, 100) // Minimum batch time
    this.#maxInterval = Math.min(params.maxWaitTime ?? 3000, 3000) // Maximum batch time
    this.#processFunction = params.processFunction
    this.#processingLoop = this.#loop()
  }

  async disposeAsync(): Promise<void> {
    this.#finished = true
    await this.#processingLoop
  }

  add(item: T): void {
    this.#queue.push(item)
  }

  count(): number {
    return this.#queue.length
  }

  #getBatch(batchSize: number): T[] {
    return this.#queue.splice(0, Math.min(batchSize, this.#queue.length))
  }

  async #loop(): Promise<void> {
    let interval = this.#baseInterval
    while (!this.#finished || this.#queue.length > 0) {
      const startTime = performance.now()
      if (this.#queue.length > 0) {
        const batch = this.#getBatch(this.#batchSize)
        //console.log('running with queue size of ' + this.#queue.length)
        await this.#processFunction(batch)
      }
      if (this.#queue.length < this.#batchSize / 2) {
        //refigure interval
        const endTime = performance.now()
        const duration = endTime - startTime
        if (duration > interval) {
          interval = Math.min(interval * 1.5, this.#maxInterval) // Increase if slow or empty
        } else {
          interval = Math.max(interval * 0.8, this.#minInterval) // Decrease if fast
        }
        /*console.log(
          'queue is waiting ' +
            interval / TIME_MS.second +
            ' with queue size of ' +
            this.#queue.length
        )*/
        await this.#delay(interval)
      }
    }
  }

  #delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
