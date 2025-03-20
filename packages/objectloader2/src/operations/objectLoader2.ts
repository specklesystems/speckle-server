import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import { Cache, Downloader } from './interfaces.js'
import IndexedDatabase from './indexedDatabase.js'
import ServerDownloader from './serverDownloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: Cache
  #downloader: Downloader

  #gathered: AsyncGeneratorQueue<Item>

  constructor(options: ObjectLoader2Options) {
    this.#objectId = options.objectId

    this.#logger = options.logger || console.log
    this.#gathered = new AsyncGeneratorQueue()
    this.#database =
      options.cache ||
      new IndexedDatabase({ streamId: options.streamId, logger: this.#logger })
    this.#downloader =
      options.downloader ||
      new ServerDownloader({
        database: this.#database,
        results: this.#gathered,
        serverUrl: options.serverUrl,
        streamId: options.streamId,
        objectId: this.#objectId,
        token: options.token
      })
  }

  async #finish(): Promise<void> {
    await Promise.all([
      this.#database.finish(),
      this.#downloader.finish(),
      this.#gathered.finish()
    ])
  }

  async getRootItem(): Promise<Item | undefined> {
    const cachedRootObject = await this.#database.getItem({ id: this.#objectId })
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this.#downloader.downloadSingle()

    await this.#database.write({ item: rootItem })
    return rootItem
  }

  async *getBases(): AsyncGenerator<Base> {
    const rootItem = await this.getRootItem()
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
      yield item.base
      count++
      if (count >= total) {
        await this.#finish()
      }
    }
    await processPromise
  }
}
