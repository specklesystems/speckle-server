import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import BatchingQueue from '../helpers/batchingQueue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { asBase, Base, CustomLogger, Item } from '../types/types.js'

export default class Downloader {
  private _logger: CustomLogger

  private _serverUrl: string
  private _streamId: string
  private _objectId: string
  private _token?: string
  private _requestUrlRootObj: string
  private _requestUrlChildren: string
  private _headers: HeadersInit

  private _idQueue: BatchingQueue<string>
  private _results: AsyncGeneratorQueue<Item>

  constructor(
    results: AsyncGeneratorQueue<Item>,
    logger: CustomLogger,
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string
  ) {
    this._results = results
    this._logger = logger

    this._serverUrl = serverUrl
    this._streamId = streamId
    this._objectId = objectId
    this._token = token
    this._idQueue = new BatchingQueue<string>(200, 1000, (batch: string[]) =>
      Downloader.downloadBatch(
        batch,
        this._requestUrlChildren,
        this._headers,
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

  async setItems(ids: string[]): Promise<void> {
    await this._idQueue.setQueue(ids)
  }

  async add(id: string): Promise<void> {
    await this._idQueue.add(id)
  }

  static processLine(chunk: string): Item {
    const pieces = chunk.split('\t')
    const [id, unparsedObj] = pieces

    let obj
    try {
      obj = JSON.parse(unparsedObj)
    } catch (e: unknown) {
      throw new Error(`Error parsing object ${id}: ${(e as Error).message}`)
    }
    return { id: id, obj: asBase(obj) }
  }

  static async downloadBatch(
    idBatch: string[],
    url: string,
    headers: HeadersInit,
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

    let allDone = false
    do {
      const { done, value } = await reader.read()
      allDone = done
      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Try to process JSON objects from the buffer
      const boundary = buffer.indexOf('\n')
      if (boundary !== -1) {
        const jsonString = buffer.substring(0, boundary + 1) // Extract complete JSON part
        buffer = buffer.substring(boundary + 1) // Keep the rest for the next chunk
        const item = Downloader.processLine(jsonString)
        results.add(item)
      }
    } while (!allDone)

    console.log('Download and parsing complete.')
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
    const item = Downloader.processLine(responseText)
    return item
  }
}
