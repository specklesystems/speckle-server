import BaseDatabase from './BaseDatabase.js'
import { ObjectLoaderRuntimeError } from './errors.js'
import { CustomLogger, Base, Item, ObjectLoader2Options } from './types.js'

export default class ObjectLoader2 {
  private _serverUrl: string
  private _streamId: string
  private _token?: string
  private _objectId: string

  private _logger: CustomLogger

  private _buffer: Record<string, Base> = {}

  private _database: BaseDatabase
  private _requestUrlRootObj: string
  //private _requestUrlChildren: string
  private _headers: HeadersInit

  constructor(
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: ObjectLoader2Options
  ) {
    this._serverUrl = serverUrl
    this._streamId = streamId
    this._token = token
    this._objectId = objectId

    this._logger = options?.customLogger || console.log

    this._database = new BaseDatabase(console.error)

    this._headers = {
      Accept: 'text/plain'
    }

    if (this._token) {
      this._headers['Authorization'] = `Bearer ${this._token}`
    }

    this._requestUrlRootObj = `${this._serverUrl}/objects/${this._streamId}/${this._objectId}/single`
    //this._requestUrlChildren = `${this._serverUrl}/api/getobjects/${this._streamId}`
    this._logger('Object loader constructor called!')
  }

  async getRawRootObject(): Promise<Base | null> {
    const cachedRootObject = await this._database.cacheGetObjects([this._objectId])
    if (cachedRootObject === null) {
      this._logger('No cached root object found!')
      return null
    }
    this._logger(`Cached root object: ${JSON.stringify(cachedRootObject)}`)
    if (cachedRootObject[this._objectId]) return cachedRootObject[this._objectId]
    const response = await fetch(this._requestUrlRootObj, {
      headers: this._headers
    })
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        throw new ObjectLoaderRuntimeError('You do not have access to the root object!')
      }
      throw new ObjectLoaderRuntimeError(
        `Failed to fetch root object: ${response.status} ${response.statusText})`
      )
    }
    const responseText = await response.text()
    const rootObj = JSON.parse(responseText) as Base

    await this._database.cacheStoreObjects([{ id: this._objectId, obj: rootObj }])
    return rootObj
  }

  async *getRawObjectIterator(): AsyncGenerator<Item> {
    const rootBase = await this.getRawRootObject()
    if (rootBase === null) {
      this._logger('No root object found!')
      return
    }
    yield { id: this._objectId, obj: rootBase }
    if (!rootBase.__closure) return
  }

  processLine(chunk: string): Item {
    const pieces = chunk.split('\t')
    const [id, unparsedObj] = pieces

    let obj: Base
    try {
      obj = JSON.parse(unparsedObj) as Base
    } catch (e: unknown) {
      throw new Error(`Error parsing object ${id}: ${(e as Error).message}`)
    }

    return {
      id,
      obj
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
