import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import CacheDatabase from './database.js'
import { ICache, IDownloader } from './interfaces.js'
import Downloader from './downloader.js'
import { CustomLogger, Base, Item } from '../types/types.js'
import { ObjectLoader2Options } from './options.js'

export default class ObjectLoader2 {
  private _objectId: string

  private _logger: CustomLogger

  private _database: ICache
  private _downloader: IDownloader

  private _gathered: AsyncGeneratorQueue<Item>

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: Partial<ObjectLoader2Options>
  ) {
    this._objectId = objectId

    this._logger = options?.customLogger || console.log
    this._gathered = new AsyncGeneratorQueue()
    this._database = options?.cache || new CacheDatabase(this._logger)
    this._downloader =
      options?.downloader ||
      new Downloader(
        this._database,
        this._gathered,
        serverUrl,
        streamId,
        this._objectId,
        token
      )
  }

  async finish(): Promise<void> {
    await Promise.all([
      this._database.finish(),
      this._downloader.finish(),
      this._gathered.finish()
    ])
  }

  async getRootObject(): Promise<Item | undefined> {
    const cachedRootObject = await this._database.getItem(this._objectId)
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this._downloader.downloadSingle()

    await this._database.write(rootItem)
    return rootItem
  }

  async *getRawObjectIterator(): AsyncGenerator<Item> {
    const rootItem = await this.getRootObject()
    if (rootItem === undefined) {
      this._logger('No root object found!')
      return
    }
    yield rootItem
    if (!rootItem.base.__closure) return
    const getPromise = this._database.getItems(
      Object.keys(rootItem.base.__closure),
      this._gathered,
      this._downloader
    )
    for await (const item of this._gathered.consume()) {
      yield item
    }
    await getPromise
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const t0 = performance.now()
    let count = 0
    for await (const item of this.getRawObjectIterator()) {
      count++
      if (count % 1000 === 0) {
        this._logger(`Loaded ${count} objects in: ${(performance.now() - t0) / 1000}`)
      }
      yield item.base
    }
    this._logger(`Loaded ${count} objects in: ${(performance.now() - t0) / 1000}`)
  }
}
