import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { asBase, Item } from '../types/types.js'
import CacheDatabase from './database.js'

export default class Downloader implements Queue<string> {
  private _serverUrl: string
  private _streamId: string
  private _objectId: string
  private _token?: string
  private _requestUrlRootObj: string
  private _requestUrlChildren: string
  private _headers: HeadersInit

  private _database: CacheDatabase
  private _idQueue: BatchingQueue<string>
  private _results: AsyncGeneratorQueue<Item>

  constructor(
    database: CacheDatabase,
    results: AsyncGeneratorQueue<Item>,
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string
  ) {
    this._database = database
    this._results = results

    this._serverUrl = serverUrl
    this._streamId = streamId
    this._objectId = objectId
    this._token = token
    this._idQueue = new BatchingQueue<string>(
      'download',
      500,
      1000,
      (batch: string[]) =>
        Downloader.downloadBatch(
          batch,
          this._requestUrlChildren,
          this._headers,
          this._database,
          this._results
        )
    )

    this._headers = {
      Accept: 'text/plain'
    }

    if (this._token) {
      this._headers['Authorization'] = `Bearer ${this._token}`
    }
    this._requestUrlChildren = `${this._serverUrl}/api/getobjects/${this._streamId}`
    this._requestUrlRootObj = `${this._serverUrl}/objects/${this._streamId}/${this._objectId}/single`
  }

  add(id: string): void {
    this._idQueue.add(id)
  }

  static processJson(id: string, unparsedObj: string): Item {
    let obj: unknown
    try {
      obj = JSON.parse(unparsedObj)
    } catch (e: unknown) {
      throw new Error(`Error parsing object ${id}: ${(e as Error).message}`)
    }
    return { id, obj: asBase(obj) }
  }

  static async downloadBatch(
    idBatch: string[],
    url: string,
    headers: HeadersInit,
    database: CacheDatabase,
    results: AsyncGeneratorQueue<Item>
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects: JSON.stringify(idBatch) })
    })

    if (!response.body) {
      throw new Error('ReadableStream not supported or response has no body.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // Temporary buffer to store incoming chunks

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Try to process JSON objects from the buffer
      let boundary = buffer.indexOf('\n')
      while (boundary !== -1) {
        const jsonString = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 1)
        boundary = buffer.indexOf('\n')
        if (jsonString) {
          const pieces = jsonString.split('\t')
          const [id, unparsedObj] = pieces
          const item = Downloader.processJson(id, unparsedObj)
          database.write(item)
          results.add(item)
        }
      }
    }
  }

  async downloadSingle(): Promise<Item> {
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
    const item = Downloader.processJson(this._objectId, responseText)
    return item
  }
}
