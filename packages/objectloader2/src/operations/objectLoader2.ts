import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import CacheDatabase from './database.js'
import Downloader from './downloader.js'
import { CustomLogger, Base, Item, ObjectLoader2Options } from '../types/types.js'

export default class ObjectLoader2 {
  private _objectId: string

  private _logger: CustomLogger

  private _buffer: Record<string, Base> = {}

  private _database: CacheDatabase
  private _downloader: Downloader

  private _gathered: AsyncGeneratorQueue<Item> = new AsyncGeneratorQueue()

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: ObjectLoader2Options
  ) {
    this._objectId = objectId

    this._logger = options?.customLogger || console.log

    this._database = new CacheDatabase(console.log)
    this._downloader = new Downloader(
      this._database,
      this._gathered,
      serverUrl,
      streamId,
      this._objectId,
      token
    )
  }

  async finish(): Promise<void> {
    await Promise.all([this._database.finish(), this._downloader.finish()])
  }

  private async getRawRootObject(): Promise<Item | undefined> {
    const cachedRootObject = await this._database.cacheGetObject(this._objectId)
    if (cachedRootObject) {
      return cachedRootObject
    }
    const rootItem = await this._downloader.downloadSingle()

    await this._database.cacheStoreObjects([rootItem])
    return rootItem
  }

  async *getRawObjectIterator(): AsyncGenerator<Item> {
    const rootItem = await this.getRawRootObject()
    if (rootItem === undefined) {
      this._logger('No root object found!')
      return
    }
    yield rootItem
    if (!rootItem.obj.__closure) return
    const getPromise = this._database.cacheGetObjects(
      Object.keys(rootItem.obj.__closure),
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
      this._buffer[item.id] = item.obj
      count++
      if (count % 1000 === 0) {
        this._logger(`Loaded ${count} objects in: ${(performance.now() - t0) / 1000}`)
      }
      yield item.obj
    }
    this._logger(`Loaded ${count} objects in: ${(performance.now() - t0) / 1000}`)
  }
}
