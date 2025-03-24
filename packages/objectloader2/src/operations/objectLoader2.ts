import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Cache, Downloader } from './interfaces.js'
import IndexedDatabase from './indexedDatabase.js'
import ServerDownloader from './serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'
import { Deferred } from '../helpers/deferred.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: Cache
  #downloader: Downloader

  #gathered: AsyncGeneratorQueue<Item>

  #buffer: Record<string, Deferred<Base>> = {}

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId

    this.#logger = options.logger || console.log
    this.#gathered = new AsyncGeneratorQueue()
    this.#database =
      options.cache ||
      new IndexedDatabase({
        logger: this.#logger,
        maxCacheReadSize: 10000,
        maxCacheWriteSize: 5000,
        indexedDB: options.indexedDB,
        keyRange: options.keyRange
      })
    this.#downloader =
      options.downloader ||
      new ServerDownloader({
        database: this.#database,
        results: this.#gathered,
        serverUrl: options.serverUrl,
        streamId: options.streamId,
        objectId: this.#objectId,
        token: options.token,
        headers: options.headers
      })
  }

  async disposeAsync(): Promise<void> {
    await Promise.all([
      this.#database.disposeAsync(),
      this.#downloader.disposeAsync(),
      this.#gathered.dispose()
    ])
  }

  async getRootObject(): Promise<Item | undefined> {
    const cachedRootObject = await this.#database.getItem({ id: this.#objectId })
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this.#downloader.downloadSingle()

    await this.#database.add(rootItem)
    return rootItem
  }

  async getObject(id: string): Promise<Base> {
    if (!this.#buffer[id]) {
      this.#buffer[id] = new Deferred()
    }
    return await this.#buffer[id].promise
  }

  async getTotalObjectCount() {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base.__closure || {}).length
    return totalChildrenCount
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const rootItem = await this.getRootObject()
    if (rootItem === undefined) {
      this.#logger('No root object found!')
      return
    }
    yield rootItem.base
    if (!rootItem.base.__closure) return

    const children = Object.keys(rootItem.base.__closure)
    const total = children.length
    this.#downloader.initializePool({ total })
    const processPromise = this.#database.processItems({
      ids: children,
      foundItems: this.#gathered,
      notFoundItems: this.#downloader
    })
    let count = 0
    for await (const item of this.#gathered.consume()) {
      if (!this.#buffer[item.baseId]) {
        this.#buffer[item.baseId] = new Deferred()
      }
      this.#buffer[item.baseId].resolve(item.base)
      yield item.base
      count++
      if (count >= total) {
        await this.disposeAsync()
      }
    }
    await processPromise
  }
}
