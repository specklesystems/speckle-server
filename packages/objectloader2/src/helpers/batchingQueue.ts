import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  private queue: T[] = []
  private batchSize: number
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>
  private count = 0
  private name: string
  private processed = 0

  constructor(
    name: string,
    batchSize: number,
    batchTime: number,
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.name = name
    this.batchSize = batchSize
    this.batchTime = batchTime
    this.processFunction = processFunction
    this.loop().then()
  }

  async add(item: T): Promise<void> {
    this.queue.push(item)
    this.count++
    console.log('Added ' + this.count + ' for ' + this.name)
    return Promise.resolve()
  }

  async addArray(items: T[]): Promise<void> {
    this.queue.push(...items)
    return Promise.resolve()
  }

  private async loop(): Promise<void> {
    while (true) {
      if (this.batchSize < this.queue.length) {
        const batch = this.queue.splice(0, this.batchSize)
        await this.processFunction(batch)
        this.processed += batch.length
        console.log('Processed ' + this.processed + ' for ' + this.name)
      } else if (this.queue.length > 0) {
        const batch = [...this.queue]
        this.queue = []
        this.processed += batch.length
        console.log('Processed ' + this.processed + ' for ' + this.name)
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
