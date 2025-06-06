import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Downloader, Database } from './interfaces.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { CacheOptions, ObjectLoader2Options } from './options.js'
import { DefermentManager } from '../helpers/defermentManager.js'
import { CacheReader } from '../helpers/cacheReader.js'
import { CachePump } from '../helpers/cachePump.js'
import AggregateQueue from '../helpers/aggregateQueue.js'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'

export class ObjectLoader2 {
  #rootId: string

  #logger: CustomLogger

  #database: Database
  #downloader: Downloader
  #pump: CachePump
  #cache: CacheReader

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
    this.#cache = new CacheReader(this.#database, this.#deferments, cacheOptions)
    this.#pump = new CachePump(
      this.#database,
      this.#gathered,
      this.#deferments,
      cacheOptions
    )
    this.#downloader = options.downloader
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([
      this.#downloader.disposeAsync(),
      this.#cache.disposeAsync(),
      this.#pump.disposeAsync()
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
    return await this.#cache.getObject({ id: params.id })
  }

  async getTotalObjectCount(): Promise<number> {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base.__closure || {}).length
    return totalChildrenCount + 1 //count the root
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const rootItem = await this.getRootObject()
    if (rootItem === undefined) {
      this.#logger('No root object found!')
      return
    }
    //only for root
    this.#pump.add(rootItem)
    yield rootItem.base
    if (!rootItem.base.__closure) return

    //sort the closures by their values descending
    const sortedClosures = Object.entries(rootItem.base.__closure).sort(
      (a, b) => b[1] - a[1]
    )
    const children = sortedClosures.map((x) => x[0])
    const total = children.length
    this.#downloader.initializePool({
      results: new AggregateQueue(this.#gathered, this.#pump),
      total
    })
    for await (const item of this.#pump.gather(children, this.#downloader)) {
      yield item.base
    }
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    return ObjectLoader2Factory.createFromObjects(objects)
  }

  static createFromJSON(json: string): ObjectLoader2 {
    return ObjectLoader2Factory.createFromJSON(json)
  }
}
