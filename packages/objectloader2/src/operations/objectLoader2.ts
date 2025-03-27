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

  #gathered: AsyncGeneratorQueue

  #deferredItems: Record<string, DeferredBase | undefined> = {}

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

  //don't await, caller does
  async getObject(params: { id: string }): Promise<Base> {
    const { id } = params
    const deferredBase = this.#deferredItems[id]
    if (deferredBase) {
      //already exists so wait
      return deferredBase.promise
    }
    //create and add in case we get another waiter
    const d = new DeferredBase(id)
    this.#deferredItems[id] = d
    let item = this.#gathered.get(id)
    if (item) {
      return this.#removeAndReturn(d, item)
    }
    item = await this.#database.getItem({ id: params.id })
    if (item) {
      return this.#removeAndReturn(d, item)
    }
    //else wait
    return d.promise
  }

  #removeAndReturn(d: DeferredBase, item: Item): Promise<Base> {
    this.#deferredItems[d.id] = undefined
    d.resolve(item.base)
    return d.promise
  }

  async getTotalObjectCount() {
    const rootObj = await this.getRootObject()
    const totalChildrenCount = Object.keys(rootObj?.base.__closure || {}).length
    return totalChildrenCount + 1 //count the root
  }

  #resolveDeferred(item: Item): void {
    const d = this.#deferredItems[item.baseId]
    if (d) {
      this.#deferredItems[item.baseId] = undefined
      d.resolve(item.base)
    }
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
      this.#resolveDeferred(item)
      yield item.base
      count++
      if (count >= total) {
        await this.disposeAsync()
      }
    }
    await processPromise
  }
}
