export class BatchProcessor<T> {
  private queue: T[] = []
  private batchSize: number
  private batchTime: number
  private processFunction: (batch: T[]) => Promise<void>
  private timeoutId: NodeJS.Timeout | null = null

  constructor(
    batchSize: number,
    batchTime: number,
    processFunction: (batch: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize
    this.batchTime = batchTime
    this.processFunction = processFunction
  }

  async add(item: T): Promise<void> {
    this.queue.push(item)

    if (this.queue.length >= this.batchSize) {
      await this.flush()
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.batchTime)
    }
  }

  private async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    await this.processFunction(batch)
  }
}
