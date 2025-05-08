import { TIME } from '@speckle/shared'
import { Database } from '../operations/indexedDatabase.js'
import { CacheOptions } from '../operations/options.js'
import { CustomLogger, Item } from '../types/types.js'
import BatchingQueue from './batchingQueue.js'
import Queue from './queue.js'
import { Downloader } from '../operations/interfaces.js'
import { DefermentManager } from './defermentManager.js'
import AsyncGeneratorQueue from './asyncGeneratorQueue.js'

export class CachePump {
  #writeQueue: BatchingQueue<Item> | undefined
  #database: Database
  #logger: CustomLogger
  #deferments: DefermentManager

  #gathered: AsyncGeneratorQueue<Item>

  #options: CacheOptions

  constructor(
    database: Database,
    gathered: AsyncGeneratorQueue<Item>,
    deferments: DefermentManager,
    options: CacheOptions
  ) {
    this.#database = database
    this.#gathered = gathered
    this.#deferments = deferments
    this.#options = options
    this.#logger = options.logger || (() => {})
  }

  async add(item: Item): Promise<void> {
    if (!this.#writeQueue) {
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: (batch: Item[]) => this.#database.cacheSaveBatch({ batch })
      })
    }
    this.#writeQueue.add(item.baseId, item)
    return Promise.resolve()
  }

  async disposeAsync(): Promise<void> {
    await this.#writeQueue?.disposeAsync()
  }

  async pumpItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void> {
    const { ids, foundItems, notFoundItems } = params
    const maxCacheReadSize = this.#options.maxCacheReadSize

    for (let i = 0; i < ids.length; ) {
      if ((this.#writeQueue?.count() ?? 0) > this.#options.maxWriteQueueSize) {
        this.#logger(
          'pausing reads (# in write queue: ' + this.#writeQueue?.count() + ')'
        )
        await new Promise((resolve) => setTimeout(resolve, TIME.second)) // Pause for 1 second, protects against out of memory
        continue
      }
      const batch = ids.slice(i, i + maxCacheReadSize)
      const cachedData = await this.#database.getAll(batch)
      for (let i = 0; i < cachedData.length; i++) {
        if (cachedData[i]) {
          foundItems.add(cachedData[i]!)
        } else {
          notFoundItems.add(batch[i])
        }
      }
      i += maxCacheReadSize
    }
  }

  async *load(ids: string[], downloader: Downloader): AsyncGenerator<Item> {
    const total = ids.length
    const pumpPromise = this.pumpItems({
      ids,
      foundItems: this.#gathered,
      notFoundItems: downloader
    })
    let count = 0
    for await (const item of this.#gathered.consume()) {
      this.#deferments.undefer(item)
      yield item
      count++
      if (count >= total) {
        this.#gathered.dispose()
      }
    }
    await pumpPromise
  }
}
