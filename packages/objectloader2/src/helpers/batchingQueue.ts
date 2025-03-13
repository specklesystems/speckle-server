import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  private queue: T[] = []
  private batchSize: number
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>
  private timeout: number | null = null

  constructor(
    batchSize: number,
    batchTime: number,
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize
    this.batchTime = batchTime
    this.processFunction = processFunction
  }

  private async checkTimeout(): Promise<void> {
    if (this.queue.length >= this.batchSize) {
      await this.flush()
    } else if (!this.timeout) {
      this.timeout = window.setTimeout(() => {
        void this.flush()
      }, this.batchTime)
    }
  }
  async add(item: T): Promise<void> {
    this.queue.push(item)
    await this.checkTimeout()
  }

  async addArray(items: T[]): Promise<void> {
    this.queue.push(...items)
    await this.checkTimeout()
  }

  async setQueue(items: T[]): Promise<void> {
    this.queue = items
    await this.checkTimeout()
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    if (this.queue.length === 0) return

    if (this.batchSize < this.queue.length) {
      const batch = this.queue.splice(0, this.batchSize)
      await this.processFunction(batch)
      await this.checkTimeout()
    } else {
      const batch = [...this.queue]
      this.queue = []
      await this.processFunction(batch)
    }
  }
}
