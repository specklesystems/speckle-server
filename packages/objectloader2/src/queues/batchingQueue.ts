import KeyedQueue from './keyedQueue.js'

export default class BatchingQueue<T> {
  #queue: KeyedQueue<string, T> = new KeyedQueue<string, T>()
  #batchSize: number
  #processFunction: (batch: T[]) => Promise<void>
  #timeoutId: ReturnType<typeof setTimeout> | null = null
  #isProcessing = false

  #disposed = false
  #batchTimeout: number

  // Helper methods for cross-environment timeout handling
  #getSetTimeoutFn(): typeof setTimeout {
    // First check for window object (browser), then fallback to global (node), then just use setTimeout
    return typeof window !== 'undefined'
      ? window.setTimeout.bind(window)
      : typeof global !== 'undefined'
      ? global.setTimeout
      : setTimeout
  }

  #getClearTimeoutFn(): typeof clearTimeout {
    // First check for window object (browser), then fallback to global (node), then just use clearTimeout
    return typeof window !== 'undefined'
      ? window.clearTimeout.bind(window)
      : typeof global !== 'undefined'
      ? global.clearTimeout
      : clearTimeout
  }

  constructor(params: {
    batchSize: number
    maxWaitTime: number
    processFunction: (batch: T[]) => Promise<void>
  }) {
    this.#batchSize = params.batchSize
    this.#processFunction = params.processFunction
    this.#batchTimeout = params.maxWaitTime
  }

  dispose(): void {
    this.#disposed = true
  }

  add(key: string, item: T): void {
    this.#queue.enqueue(key, item)
    this.#addCheck()
  }

  addAll(keys: string[], items: T[]): void {
    this.#queue.enqueueAll(keys, items)
    this.#addCheck()
  }

  #addCheck(): void {
    if (this.#queue.size >= this.#batchSize) {
      // Fire and forget, no need to await
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#flush()
    } else {
      if (this.#timeoutId) {
        this.#getClearTimeoutFn()(this.#timeoutId)
      }
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.#timeoutId = this.#getSetTimeoutFn()(() => this.#flush(), this.#batchTimeout)
    }
  }

  async #flush(): Promise<void> {
    if (this.#timeoutId) {
      this.#getClearTimeoutFn()(this.#timeoutId)
      this.#timeoutId = null
    }

    if (this.#isProcessing || this.#queue.size === 0) {
      return
    }
    this.#isProcessing = true

    const batchToProcess = this.#getBatch(this.#batchSize)

    try {
      await this.#processFunction(batchToProcess)
    } catch (error) {
      console.error('Batch processing failed:', error)
    } finally {
      this.#isProcessing = false
    }
    this.#addCheck()
  }

  get(id: string): T | undefined {
    return this.#queue.get(id)
  }

  count(): number {
    return this.#queue.size
  }

  isDisposed(): boolean {
    return this.#disposed
  }

  #getBatch(batchSize: number): T[] {
    return this.#queue.spliceValues(0, Math.min(batchSize, this.#queue.size))
  }
}
