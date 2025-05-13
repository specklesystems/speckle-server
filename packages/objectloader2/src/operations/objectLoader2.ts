import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Downloader, Database } from './interfaces.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { CacheOptions, ObjectLoader2Options } from './options.js'
import { DefermentManager } from '../helpers/defermentManager.js'
import { CacheReader } from '../helpers/cacheReader.js'
import { CachePump } from '../helpers/cachePump.js'
import AggregateQueue from '../helpers/aggregateQueue.js'
import { ObjectLoaderFactory } from './objectLoaderFactory.js'

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
    this.#logger = options.logger || console.log

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
      maxSize: 200_000,
      ttl: 10_000,
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
    await Promise.all([this.#downloader.disposeAsync(), this.#cache.disposeAsync()])
    this.#deferments.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    if (!this.#root) {
      this.#root = await this.#database.getItem({ id: this.#rootId })
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

    const children = Object.keys(rootItem.base.__closure)
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
    return ObjectLoaderFactory.createFromObjects(objects)
  }

  static createFromJSON(json: string): ObjectLoader2 {
    return ObjectLoaderFactory.createFromJSON(json)
  }
}
