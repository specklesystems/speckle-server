import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Downloader } from './interfaces.js'
import IndexedDatabase from './indexedDatabase.js'
import ServerDownloader from './serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'
import { MemoryDownloader } from './memoryDownloader.js'
import { MemoryDatabase } from './memoryDatabase.js'
import { DefermentManager } from '../helpers/defermentManager.js'
import { CacheReader } from '../helpers/cacheReader.js'
import { CachePump } from '../helpers/cachePump.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: IndexedDatabase
  #downloader: Downloader
  #pump: CachePump
  #cache: CacheReader

  #deferments: DefermentManager

  #gathered: AsyncGeneratorQueue<Item>

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId

    this.#logger = options.logger || console.log
    this.#gathered = options.results || new AsyncGeneratorQueue()
    this.#database = new IndexedDatabase({
      logger: this.#logger,
      maxCacheReadSize: 10_000,
      maxCacheWriteSize: 10_000,
      maxWriteQueueSize: 40_000,
      maxCacheBatchWriteWait: 3_000,
      indexedDB: options.indexedDB,
      keyRange: options.keyRange
    })
    this.#pump = new CachePump(this.#database, {
      logger: this.#logger,
      maxCacheReadSize: 10_000,
      maxCacheWriteSize: 10_000,
      maxWriteQueueSize: 40_000,
      maxCacheBatchWriteWait: 3_000,
      indexedDB: options.indexedDB,
      keyRange: options.keyRange
    })
    this.#downloader =
      options.downloader ||
      new ServerDownloader({
        database: this.#pump,
        results: this.#gathered,
        serverUrl: options.serverUrl,
        streamId: options.streamId,
        objectId: this.#objectId,
        token: options.token,
        headers: options.headers
      })
    this.#deferments = new DefermentManager(100_000, 20_000)
    this.#cache = new CacheReader(this.#database, this.#deferments, this.#logger)
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([this.#downloader.disposeAsync(), this.#cache.disposeAsync()])
    this.#deferments.dispose()
  }

  async getRootObject(): Promise<Item | undefined> {
    const cachedRootObject = await this.#database.getItem({ id: this.#objectId })
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this.#downloader.downloadSingle()

    return rootItem
  }

  async getObject(params: { id: string }): Promise<Base> {
    if (!this.#deferments.isDeferred(params.id)) {
      this.#cache.getItem(params.id)
    }
    return await this.#deferments.defer({ id: params.id })
  }

  async getTotalObjectCount() {
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
    await this.#pump.add(rootItem)
    yield rootItem.base
    if (!rootItem.base.__closure) return

    const children = Object.keys(rootItem.base.__closure)
    const total = children.length
    this.#downloader.initializePool({ total })
    const pumpPromise = this.#pump.pumpItems({
      ids: children,
      foundItems: this.#gathered,
      notFoundItems: this.#downloader
    })
    let count = 0
    for await (const item of this.#gathered.consume()) {
      this.#deferments.undefer(item)
      yield item.base
      count++
      if (count >= total) {
        await this.#pump.disposeAsync()
        this.#gathered.dispose()
      }
    }
    await pumpPromise
  }

  static createFromObjects(objects: Base[]): ObjectLoader2 {
    const root = objects[0]
    const records: Record<string, Base> = {}
    objects.forEach((element) => {
      records[element.id] = element
    })
    const loader = new ObjectLoader2({
      serverUrl: 'dummy',
      streamId: 'dummy',
      objectId: root.id,
      cache: new MemoryDatabase({ items: records }),
      downloader: new MemoryDownloader(root.id, records)
    })
    return loader
  }

  static createFromJSON(json: string): ObjectLoader2 {
    const jsonObj = JSON.parse(json) as Base[]
    return this.createFromObjects(jsonObj)
  }
}
