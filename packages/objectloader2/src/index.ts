import { BaseDatabase } from './BaseDatabase'
import { Base, CustomLogger, Item } from './types'
import { ObjectLoaderRuntimeError } from './errors'

class ObjectLoader2Options {
  customLogger?: CustomLogger
}
export class BaseDatabaseOptions {
  enableCaching: boolean = false
}
class ObjectLoader2 {
  private _serverUrl: string
  private _streamId: string
  private _token?: string
  private _objectId: string

  private _logger: CustomLogger

  private _buffer: Record<string, Base> = {}

  private _database: BaseDatabase
  private _requestUrlRootObj: string
  private _requestUrlChildren: string

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

    this._database = new BaseDatabase()

    this._headers = {
      Accept: 'text/plain'
    }

    if (this._token) {
      this._headers['Authorization'] = `Bearer ${this._token}`
    }

    this._requestUrlRootObj = `${this._serverUrl}/objects/${this._streamId}/${this._objectId}/single`
    this._requestUrlChildren = `${this._serverUrl}/api/getobjects/${this._streamId}`

    this._logger('Object loader constructor called!')
  }

  async getRawRootObject() {
    const cachedRootObject = await this._database.cacheGetObjects([this._objectId])
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

    //this.cacheStoreObjects([`${this._objectId}\t${responseText}`])
    return responseText
  }

  async *getRawObjectIterator(): AsyncGenerator<string> {}

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
    for await (const line of this.getRawObjectIterator()) {
      const { id, obj } = this.processLine(line)
      this._buffer[id] = obj
      count += 1
      yield obj
    }
    this._logger(`Loaded ${count} objects in: ${(Date.now() - t0) / 1000}`)
  }
}

export default ObjectLoader2
