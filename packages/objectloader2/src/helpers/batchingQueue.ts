import Queue from './queue.js'

export default class BatchingQueue<T> implements Queue<T> {
  private queue: T[] = []
  private batchSize: number
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>
  private name: string

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
    this.loop().catch((e) => {
      throw e
    })
  }

  add(item: T): void {
    this.queue.push(item)
  }

  private async loop(): Promise<void> {
    console.log('Starting loop for ' + this.name)
    while (true) {
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
