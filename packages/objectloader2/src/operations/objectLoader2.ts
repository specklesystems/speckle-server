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

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: Partial<ObjectLoader2Options>
  ) {
    this.#objectId = objectId

    this.#logger = options?.logger || console.log
    this.#gathered = new AsyncGeneratorQueue()
    this.#database = options?.cache || new IndexedDatabase({ logger: this.#logger })
    this.#downloader =
      options?.downloader ||
      new ServerDownloader(
        this.#database,
        this.#gathered,
        serverUrl,
        streamId,
        this.#objectId,
        token
      )
  }

  async #finish(): Promise<void> {
    await Promise.all([
      this.#database.finish(),
      this.#downloader.finish(),
      this.#gathered.finish()
    ])
  }

  async getRootItem(): Promise<Item | undefined> {
    const cachedRootObject = await this.#database.getItem(this.#objectId)
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this.#downloader.downloadSingle()

    await this.#database.write(rootItem)
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
    this.#downloader.initializePool(total)
    const processPromise = this.#database.processItems(
      children,
      this.#gathered,
      this.#downloader
    )
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
