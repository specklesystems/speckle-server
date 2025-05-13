import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Downloader, Database } from './interfaces.js'
import IndexedDatabase from './databases/indexedDatabase.js'
import ServerDownloader from './downloaders/serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { CacheOptions, ObjectLoader2Options } from './options.js'
import { MemoryDownloader } from './downloaders/memoryDownloader.js'
import { MemoryDatabase } from './databases/memoryDatabase.js'
import { DefermentManager } from '../helpers/defermentManager.js'
import { CacheReader } from '../helpers/cacheReader.js'
import { CachePump } from '../helpers/cachePump.js'
import AggregateQueue from '../helpers/AggregateQueue.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: Database
  #downloader: Downloader
  #pump: CachePump
  #cache: CacheReader

  #deferments: DefermentManager

  #gathered: AsyncGeneratorQueue<Item>

  #root?: Item = undefined

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId
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
    this.#database =
      options.database ??
      new IndexedDatabase({
        logger: this.#logger,
        indexedDB: options.indexedDB,
        keyRange: options.keyRange
      })
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
    this.#downloader =
      options.downloader ||
      new ServerDownloader({
        serverUrl: options.serverUrl,
        streamId: options.streamId,
        objectId: this.#objectId,
        token: options.token,
        headers: options.headers
      })
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([this.#downloader.disposeAsync(), this.#cache.disposeAsync()])
    this.#deferments.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    if (!this.#root) {
      this.#root = await this.#database.getItem({ id: this.#objectId })
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
    this.#downloader.initializePool({ results: new AggregateQueue(this.#gathered, this.#pump), total })
    for await (const item of this.#pump.gather(children, this.#downloader)) {
      yield item.base
    }
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    const root = objects[0]
    const records: Map<string, Base> = new Map<string, Base>()
    objects.forEach((element) => {
      records.set(element.id, element)
    })
    const loader = new ObjectLoader2({
      serverUrl: 'dummy',
      streamId: 'dummy',
      objectId: root.id,
      database: new MemoryDatabase({ items: records }),
      downloader: new MemoryDownloader(root.id, records)
    })
    return loader
  }

  static createFromJSON(json: string): ObjectLoader2 {
    const jsonObj = JSON.parse(json) as Base[]
    return this.createFromObjects(jsonObj)
  }
}
