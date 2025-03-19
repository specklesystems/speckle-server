import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import CacheDatabase from './database.js'
import { ICache, IDownloader } from './interfaces.js'
import Downloader from './downloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'

export default class ObjectLoader2 {
  #objectId: string

  #logger: CustomLogger

  #database: ICache
  #downloader: IDownloader

  #gathered: AsyncGeneratorQueue<Item>

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: Partial<ObjectLoader2Options>
  ) {
    this.#objectId = objectId

    this.#logger = options?.customLogger || console.log
    this.#gathered = new AsyncGeneratorQueue()
    this.#database = options?.cache || new CacheDatabase()
    this.#downloader =
      options?.downloader ||
      new Downloader(
        this.#database,
        this.#gathered,
        serverUrl,
        streamId,
        this.#objectId,
        token
      )
  }

  async finish(): Promise<void> {
    await Promise.all([
      this.#database.finish(),
      this.#downloader.finish(),
      this.#gathered.finish()
    ])
  }

  async getRootObject(): Promise<Item | undefined> {
    const cachedRootObject = await this.#database.getItem(this.#objectId)
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this.#downloader.downloadSingle()

    await this.#database.write(rootItem)
    return rootItem
  }

  async *getRawObjectIterator(): AsyncGenerator<Item> {
    const rootItem = await this.getRootObject()
    if (rootItem === undefined) {
      this.#logger('No root object found!')
      return
    }
    yield rootItem
    if (!rootItem.base.__closure) return
    const getPromise = this.#database.getItems(
      Object.keys(rootItem.base.__closure),
      this.#gathered,
      this.#downloader
    )
    for await (const item of this.#gathered.consume()) {
      yield item
    }
    await getPromise
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    for await (const item of this.getRawObjectIterator()) {
      yield item.base
    }
  }
}
