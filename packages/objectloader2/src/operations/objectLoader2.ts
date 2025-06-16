import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Downloader, Database } from './interfaces.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { CacheOptions, ObjectLoader2Options } from './options.js'
import { DefermentManager } from '../helpers/defermentManager.js'
import { CacheReader } from '../helpers/cacheReader.js'
import AggregateQueue from '../helpers/aggregateQueue.js'
import { ObjectLoader2Factory } from './objectLoader2Factory.js'
import { CacheWriter } from '../helpers/cacheWriter.js'

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
      maxSizeInMb: 2_000, // 2 GBs
      ttlms: 15_000, // 15 seconds
      logger: this.#logger
    })
    this.#downloader = options.downloader
    this.#cacheReader = new CacheReader(this.#database, this.#deferments, cacheOptions)
    this.#cacheReader.initializeQueue(this.#gathered, this.#downloader)
    this.#cacheWriter = new CacheWriter(this.#database, cacheOptions)
  }

  async disposeAsync(): Promise<void> {
    this.#gathered.dispose()
    await Promise.all([
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
    //only for root
    this.#gathered.add(rootItem)
    yield rootItem.base
    if (!rootItem.base.__closure) return

    //sort the closures by their values descending
    const sortedClosures = Object.entries(rootItem.base.__closure).sort(
      (a, b) => b[1] - a[1]
    )
    const children = sortedClosures.map((x) => x[0])
    const total = children.length
    this.#downloader.initializePool({
      results: new AggregateQueue(this.#gathered, this.#cacheWriter),
      total
    })
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
