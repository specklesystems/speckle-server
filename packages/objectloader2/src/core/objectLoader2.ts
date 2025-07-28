import { MemoryCache } from '../deferment/MemoryCache.js'
import { DefermentManager } from '../deferment/defermentManager.js'
import AggregateQueue from '../queues/aggregateQueue.js'
import AsyncGeneratorQueue from '../queues/asyncGeneratorQueue.js'
import { CustomLogger, take } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { Database, Downloader } from './interfaces.js'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'
import { ObjectLoader2Options, CacheOptions } from './options.js'
import { CacheReader } from './stages/cacheReader.js'
import { AggregateCacheReaderWorker } from './stages/AggregateCacheReaderWorker.js'
import { CacheWriter } from './stages/cacheWriter.js'
import { CacheWriterWorker } from './stages/cacheWriterWorker.js'
import { Reader, Writer } from './stages/interfaces.js'

const MAX_CLOSURES_TO_TAKE = 100
const EXPECTED_CLOSURE_VALUE = 100

export class ObjectLoader2 {
  #rootId: string

  #logger: CustomLogger

  #database: Database
  #downloader: Downloader
  #reader: Reader
  #writer: Writer

  #deferments: DefermentManager
  #cache: MemoryCache

  #gathered: AsyncGeneratorQueue<Item>

  #root?: Item = undefined
  #isRootStored = false

  constructor(options: ObjectLoader2Options) {
    this.#rootId = options.rootId
    this.#logger = options.logger || ((): void => {})

    const cacheOptions: CacheOptions = {
      logger: this.#logger,
      maxCacheReadSize: 10_000,
      maxCacheWriteSize: 10_000,
      maxWriteQueueSize: 40_000,
      maxCacheBatchWriteWait: 100, //100 ms, next to nothing!
      maxCacheBatchReadWait: 100 //100 ms, next to nothing!
    }

    this.#gathered = new AsyncGeneratorQueue()

    this.#database = options.database
    this.#cache = new MemoryCache(
      {
        maxSizeInMb: 500, // 500 MB
        ttlms: 5_000 // 5 seconds
      },
      this.#logger
    )
    this.#deferments = new DefermentManager(this.#cache, this.#logger)
    this.#downloader = options.downloader
    if (options.useReadWorker) {
      this.#reader = new AggregateCacheReaderWorker(this.#deferments, 3, this.#logger)
    } else {
      this.#reader = new CacheReader(this.#database, this.#deferments, cacheOptions)
    }
    this.#reader.initializeQueue(this.#gathered, this.#downloader)
    if (options.useWriteWorker) {
      this.#writer = new CacheWriterWorker(this.#logger)
    } else {
      this.#writer = new CacheWriter(this.#database, cacheOptions)
    }
  }

  log(message: string, ...args: unknown[]): void {
    this.#logger(`[ObjectLoader2] ${message}`, ...args)
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([
      this.#gathered.disposeAsync(),
      this.#downloader.disposeAsync(),
      this.#writer.disposeAsync(),
      this.#reader.disposeAsync()
    ])
    this.#deferments.dispose()
    this.#cache.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    if (!this.#root) {
      this.#root = (await this.#database.getAll([this.#rootId]))[0]
      if (!this.#root) {
        this.#root = await this.#downloader.downloadSingle()
      } else {
        this.#isRootStored = true
      }
    }
    return this.#root
  }

  async getObject(params: { id: string }): Promise<Base> {
    return await this.#reader.getObject({ id: params.id })
  }

  async getTotalObjectCount(): Promise<number> {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base?.__closure || {}).length
    return totalChildrenCount + 1 //count the root
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const rootItem = await this.getRootObject()
    if (rootItem?.base === undefined) {
      this.log('No root object found!')
      return
    }
    if (!rootItem.base.__closure) {
      yield rootItem.base
      return
    }

    //sort the closures by their values descending
    const sortedClosures = Object.entries(rootItem.base.__closure ?? []).sort(
      (a, b) => b[1] - a[1]
    )
    this.log(
      'calculated closures: ',
      !take(sortedClosures.values(), MAX_CLOSURES_TO_TAKE).every(
        (x) => x[1] === EXPECTED_CLOSURE_VALUE
      )
    )
    const children = sortedClosures.map((x) => x[0])
    const total = children.length + 1 // +1 for the root object
    this.#downloader.initializePool({
      results: new AggregateQueue(this.#gathered, this.#writer),
      total
    })
    //only for root
    const start = performance.now()
    this.#gathered.add(rootItem)
    this.#reader.requestAll(children)
    let count = 0
    for await (const item of this.#gathered.consume()) {
      this.#deferments.undefer(item, (id: string) => this.#reader.requestItem(id))
      yield item.base! //always defined, as we add it to the queue
      count++
      if (count >= total) {
        break
      }
    }
    if (!this.#isRootStored) {
      await this.#database.saveBatch({ batch: [rootItem] })
      this.#isRootStored = true
    }
    this.log(
      `getObjectIterator: processed ${count} items in ${performance.now() - start}ms`
    )
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    return ObjectLoader2Factory.createFromObjects(objects)
  }

  static createFromJSON(json: string): ObjectLoader2 {
    return ObjectLoader2Factory.createFromJSON(json)
  }
}
