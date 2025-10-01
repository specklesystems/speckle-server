import KeyedQueue from './keyedQueue.js'

/**
 * Default wait time in milliseconds for processing ongoing tasks during disposal.
 * This value was chosen to balance responsiveness and CPU usage in typical scenarios.
 */
const PROCESSING_WAIT_TIME_MS = 100

export default class BatchingQueue<T> {
  #queue: KeyedQueue<string, T> = new KeyedQueue<string, T>()
  #batchSize: number
  #processFunction: (batch: T[]) => Promise<void>
  #timeoutId: ReturnType<typeof setTimeout> | null = null

  #isProcessing = false
  #isDisposed = false
  #isErrored = false
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

  async disposeAsync(): Promise<void> {
    if (this.#isDisposed) return
    this.#isDisposed = true
    if (this.#timeoutId) {
      this.#getClearTimeoutFn()(this.#timeoutId)
      this.#timeoutId = null
    }

    // Wait for any ongoing processing to finish
    while (this.#isProcessing) {
      await new Promise((resolve) =>
        this.#getSetTimeoutFn()(resolve, PROCESSING_WAIT_TIME_MS)
      )
    }

    // After any ongoing flush is completed, there might be items in the queue.
    // We should flush them.
    if (this.#queue.size > 0) {
      await this.flush()
    }
  }

  add(key: string, item: T): void {
    if (this.#isDisposed || this.#isErrored) return
    this.#queue.enqueue(key, item)
    this.#addCheck()
  }

  addAll(keys: string[], items: T[]): void {
    if (this.#isDisposed || this.#isErrored) return
    this.#queue.enqueueAll(keys, items)
    this.#addCheck()
  }

  #addCheck(): void {
    if (this.#isDisposed) return
    if (this.#queue.size >= this.#batchSize) {
      // Fire and forget, no need to await
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.flush()
    } else {
      if (this.#timeoutId) {
        this.#getClearTimeoutFn()(this.#timeoutId)
      }
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.#timeoutId = this.#getSetTimeoutFn()(() => this.flush(), this.#batchTimeout)
    }
  }

  async flush(): Promise<void> {
    if (this.#timeoutId) {
      this.#getClearTimeoutFn()(this.#timeoutId)
      this.#timeoutId = null
    }

    if (this.#isErrored || this.#isProcessing || this.#queue.size === 0) {
      return
    }
    this.#isProcessing = true

    try {
      const batchToProcess = this.#getBatch(this.#batchSize)
      await this.#processFunction(batchToProcess)
    } catch (error) {
      console.error('Batch processing failed:', error)
      this.#isErrored = true
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
    return this.#isDisposed
  }

  isErrored(): boolean {
    return this.#isErrored
  }

  #getBatch(batchSize: number): T[] {
    return this.#queue.spliceValues(0, Math.min(batchSize, this.#queue.size))
  }
}
