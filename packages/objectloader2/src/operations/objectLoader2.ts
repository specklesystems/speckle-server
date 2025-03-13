import AsyncBuffer from '../helpers/asyncGeneratorQueue.js'
import BaseDatabase from './database.js'
import BaseDownloader from './downloader.js'
import { CustomLogger, Base, Item, ObjectLoader2Options } from '../types/types.js'

export default class ObjectLoader2 {
  private _objectId: string

  private _logger: CustomLogger

  private _buffer: Record<string, Base> = {}

  private _database: BaseDatabase
  private _downloader: BaseDownloader
  //private _requestUrlChildren: string
  private _headers: HeadersInit

  private _gathered: AsyncBuffer<Item> = new AsyncBuffer()

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: ObjectLoader2Options
  ) {
    this._objectId = objectId

    this._logger = options?.customLogger || console.log

    this._database = new BaseDatabase(console.error)
    this._downloader = new BaseDownloader(
      this._gathered,
      this._logger,
      serverUrl,
      streamId,
      this._objectId,
      token
    )

    this._headers = {
      Accept: 'text/plain'
    }

    if (token) {
      this._headers['Authorization'] = `Bearer ${token}`
    }

    this._logger('Object loader constructor called!')
  }

  async getRawRootObject(): Promise<Base | null> {
    const cachedRootObject = await this._database.cacheGetObjects([this._objectId])
    if (cachedRootObject === null) {
      this._logger('No cached root object found!')
      return null
    }
    if (cachedRootObject[this._objectId]) return cachedRootObject[this._objectId]
    const rootItem = await this._downloader.downloadSingle()

    await this._database.cacheStoreObjects([rootItem])
    return rootItem
  }

  async *getRawObjectIterator(): AsyncGenerator<Item> {
    const rootBase = await this.getRawRootObject()
    if (rootBase === null) {
      this._logger('No root object found!')
      return
    }
    yield { id: this._objectId, obj: rootBase }
    if (!rootBase.__closure) return
    await this._downloader.setItems(Object.keys(rootBase.__closure))
    for await (const item of this._gathered.consume()) {
      yield item
    }
  }

  async *getObjectIterator(): AsyncGenerator<Base> {
    const t0 = Date.now()
    let count = 0
    for await (const item of this.getRawObjectIterator()) {
      this._buffer[item.id] = item.obj
      count += 1
      yield item.obj
    }
    this._logger(`Loaded ${count} objects in: ${(Date.now() - t0) / 1000}`)
  }
}
