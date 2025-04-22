import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Cache, Downloader } from './interfaces.js'
import IndexedDatabase from './indexedDatabase.js'
import ServerDownloader from './serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'
import { DeferredBase } from '../helpers/deferredBase.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: Cache
  #downloader: Downloader

  #gathered: AsyncGeneratorQueue<Item>

  #buffer: DeferredBase[] = []

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId

    this.#logger = options.logger || console.log
    this.#gathered = new AsyncGeneratorQueue()
    this.#database =
      options.cache ||
      new IndexedDatabase({
        logger: this.#logger,
        maxCacheReadSize: 10_000,
        maxCacheWriteSize: 5_000,
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

  async getObject(params: { id: string }): Promise<Base> {
    const item = await this.#database.getItem({ id: params.id })
    if (item) {
      return item.base
    }
    const deferredBase = this.#buffer.find((x) => x.id === params.id)
    if (deferredBase) {
      return await deferredBase.promise
    }
    const d = new DeferredBase(params.id)
    this.#buffer.push(d)
    return d
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
      const deferredIndex = this.#buffer.findIndex((x) => x.id === item.baseId)
      if (deferredIndex !== -1) {
        const deferredBase = this.#buffer[deferredIndex]
        deferredBase.resolve(item.base)
        this.#buffer.splice(deferredIndex, 1)
      }
      yield item.base
      count++
      if (count >= total) {
        await this.disposeAsync()
      }
    }
    await processPromise
  }
}
