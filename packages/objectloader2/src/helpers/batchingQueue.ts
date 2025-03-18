import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  private queue: T[] = []
  private batchSize: number
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>

  private processingLoop: Promise<void>
  private finished = false

  constructor(
    batchSize: number,
    batchTime: number,
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize
    this.batchTime = batchTime
    this.processFunction = processFunction
    this.processingLoop = this.loop()
  }

  async finish(): Promise<void> {
    this.finished = true
    await this.processingLoop
  }

  add(item: T): void {
    this.queue.push(item)
  }

  private async loop(): Promise<void> {
    while (!this.finished || this.queue.length > 0) {
      if (this.batchSize < this.queue.length) {
        const batch = this.queue.splice(0, this.batchSize)
        await this.processFunction(batch)
      } else if (this.queue.length > 0) {
        const batch = [...this.queue]
        this.queue = []
        await this.processFunction(batch)
      } else {
        await this.delay(this.batchTime)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
