import { WorkerCachingConstants } from '../../caching/WorkerCachingConstants.js'
import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger, delay } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { CacheReaderWorker } from './cacheReaderWorker.js'
import { Reader } from './interfaces.js'

export class AggregateCacheReaderWorker implements Reader {
  private workers: CacheReaderWorker[] = []

  constructor(defermentManager: DefermentManager, count: number, logger: CustomLogger) {
    for (let i = 0; i < count; i++) {
      const worker = new CacheReaderWorker(defermentManager, i, logger)
      this.workers.push(worker)
    }
  }

  #getLowestCount(): CacheReaderWorker {
    return this.workers.reduce((shortest, current) =>
      current.readQueueSize < shortest.readQueueSize ? current : shortest
    )
  }

  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void {
    this.workers.forEach((worker) => {
      worker.initializeQueue(foundQueue, notFoundQueue)
    })
  }
  getObject(params: { id: string }): Promise<Base> {
    return this.workers[0].getObject(params)
  }

  requestItem(id: string): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.requestAllInternal([id])
  }

  requestAll(keys: string[]): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.requestAllInternal(keys)
  }
  private async requestAllInternal(keys: string[]): Promise<void> {
    let remainingKeys = keys
    while (remainingKeys.length > 0) {
      const s = remainingKeys.slice(0, WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE)
      let enqueuedInChunk = 0
      while (enqueuedInChunk < s.length) {
        const actuallyEnqueued = await this.#getRandomWorker().enqueue(
          s.slice(enqueuedInChunk),
          WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
        )
        if (actuallyEnqueued === 0) {
          await delay(1000)
          continue
        }
        enqueuedInChunk += actuallyEnqueued
      }
      remainingKeys = remainingKeys.slice(s.length)
    }
  }
  disposeAsync(): Promise<void> {
    return Promise.all(this.workers.map((worker) => worker.disposeAsync())).then(() => {
      this.workers = []
    })
  }
}
