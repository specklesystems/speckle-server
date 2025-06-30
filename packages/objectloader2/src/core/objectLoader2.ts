import { DefermentManager } from '../deferment/defermentManager.js'
import AggregateQueue from '../queues/aggregateQueue.js'
import AsyncGeneratorQueue from '../queues/asyncGeneratorQueue.js'
import { CustomLogger } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { Database, Downloader } from './interfaces.js'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'
import { ObjectLoader2Options, CacheOptions } from './options.js'
import { CacheReader } from './stages/cacheReader.js'
import { CacheWriter } from './stages/cacheWriter.js'

export class ObjectLoader2 {
  #rootId: string

  #logger: CustomLogger

  #database: Database
  #downloader: Downloader
  #cacheReader: CacheReader
  #cacheWriter: CacheWriter

  #deferments: DefermentManager

  #gathered: AsyncGeneratorQueue<Item>

  #root?: Item = undefined

  constructor(options: ObjectLoader2Options) {
    this.#rootId = options.rootId
    this.#logger = options.logger || ((): void => {})

    const cacheOptions: CacheOptions = {
      logger: this.#logger,
      maxCacheReadSize: 10_000,
      maxCacheWriteSize: 10_000,
      maxWriteQueueSize: 40_000,
      maxCacheBatchWriteWait: 3_000,
      maxCacheBatchReadWait: 3_000
    }

    this.#gathered = new AsyncGeneratorQueue()

    this.#database = options.database
    this.#deferments = new DefermentManager({
      maxSizeInMb: 2_000, // 2 GBs
      ttlms: 15_000, // 15 seconds
      logger: this.#logger
    })
    this.#downloader = options.downloader
    this.#cacheReader = new CacheReader(this.#database, this.#deferments, cacheOptions)
    this.#cacheReader.initializeQueue(this.#gathered, this.#downloader)
    this.#cacheWriter = new CacheWriter(this.#database, this.#deferments, cacheOptions)
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([
      this.#gathered.disposeAsync(),
      this.#downloader.disposeAsync(),
      this.#cacheReader.disposeAsync(),
      this.#cacheWriter.disposeAsync()
    ])
    this.#deferments.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    if (!this.#root) {
      this.#root = (await this.#database.getAll([this.#rootId]))[0]
      if (!this.#root) {
        this.#root = await this.#downloader.downloadSingle()
      }
    }
    return this.#root
  }

  async getObject(params: { id: string }): Promise<Base> {
    return await this.#cacheReader.getObject({ id: params.id })
  }

  async getTotalObjectCount(): Promise<number> {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base?.__closure || {}).length
    return totalChildrenCount + 1 //count the root
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const rootItem = await this.getRootObject()
    if (rootItem?.base === undefined) {
      this.#logger('No root object found!')
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
    const children = sortedClosures.map((x) => x[0])
    const total = children.length + 1 // +1 for the root object
    this.#downloader.initializePool({
      results: new AggregateQueue(this.#gathered, this.#cacheWriter),
      total
    })
    //only for root
    this.#gathered.add(rootItem)
    this.#cacheReader.requestAll(children)
    let count = 0
    for await (const item of this.#gathered.consume()) {
      yield item.base! //always defined, as we add it to the queue
      count++
      if (count >= total) {
        break
      }
    }
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    return ObjectLoader2Factory.createFromObjects(objects)
  }

  static createFromJSON(json: string): ObjectLoader2 {
    return ObjectLoader2Factory.createFromJSON(json)
  }
}
