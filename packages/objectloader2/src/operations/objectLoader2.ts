import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Cache, Downloader } from './interfaces.js'
import IndexedDatabase from './indexedDatabase.js'
import ServerDownloader from './serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'
import { MemoryDownloader } from './memoryDownloader.js'
import { MemoryDatabase } from './memoryDatabase.js'
import { DefermentManager } from '../helpers/defermentManager.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: Cache
  #downloader: Downloader

  #deferments: DefermentManager

  #gathered: AsyncGeneratorQueue<Item>

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId

    this.#logger = options.logger || console.log
    this.#gathered = options.results || new AsyncGeneratorQueue()
    this.#deferments = new DefermentManager()
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
    const t0 = performance.now()
    console.log('About to start  ' + (performance.now() - t0) / 1000)
    for await (const item of this.#gathered.consume()) {
      if (count % 1000 === 0) {
        console.log('Got ' + count + ' ' + (performance.now() - t0) / 1000)
      }
      this.#deferments.undefer(item)
      yield item.base
      count++
      if (count >= total) {
        await this.disposeAsync()
      }
    }
    await processPromise
    console.log('Done ' + count + ' ' + (performance.now() - t0) / 1000)
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
