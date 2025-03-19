import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { isBase, Item } from '../types/types.js'
import { ICache, IDownloader } from './interfaces.js'
import { BaseDownloadOptions } from './options.js'

export default class Downloader implements IDownloader {
  private _serverUrl: string
  private _streamId: string
  private _objectId: string
  private _token?: string
  private _requestUrlRootObj: string
  private _requestUrlChildren: string
  private _headers: HeadersInit
  private _options: BaseDownloadOptions

  private _database: ICache
  private _downloadQueue: BatchingQueue<string>
  private _results: Queue<Item>

  constructor(
    database: ICache,
    results: Queue<Item>,
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: Partial<BaseDownloadOptions>
  ) {
    this._database = database
    this._results = results

    this._serverUrl = serverUrl
    this._streamId = streamId
    this._objectId = objectId
    this._token = token
    this._options = {
      ...{
        fetch: (...args) => window.fetch(...args),
        batchMaxSize: 5000,
        batchMaxWait: 1000
      },
      ...options
    }
    this._downloadQueue = new BatchingQueue<string>(
      this._options.batchMaxSize,
      this._options.batchMaxWait,
      (batch: string[]) =>
        this.downloadBatch(
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

  add(id: string): void {
    this._downloadQueue.add(id)
  }

  async finish(): Promise<void> {
    await this._downloadQueue.finish()
  }

  static processJson(baseId: string, unparsedBase: string): Item {
    let base: unknown
    try {
      base = JSON.parse(unparsedBase)
    } catch (e: unknown) {
      throw new Error(`Error parsing object ${baseId}: ${(e as Error).message}`)
    }
    if (isBase(base)) {
      return { baseId, base }
    } else {
      throw new ObjectLoaderRuntimeError(`${baseId} is not a base`)
    }
  }

  async downloadBatch(
    idBatch: string[],
    url: string,
    headers: HeadersInit,
    results: Queue<Item>
  ): Promise<void> {
    const response = await this._options.fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects: JSON.stringify(idBatch) })
    })

    this.validateResponse(response)
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
          await this._database.write(item)
          results.add(item)
        }
      }
    }
  }

  async downloadSingle(): Promise<Item> {
    const response = await this._options.fetch(this._requestUrlRootObj, {
      headers: this._headers
    })
    this.validateResponse(response)
    const responseText = await response.text()
    const item = Downloader.processJson(this._objectId, responseText)
    return item
  }

  validateResponse(response: Response): void {
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        throw new ObjectLoaderRuntimeError('You do not have access!')
      }
      throw new ObjectLoaderRuntimeError(
        `Failed to fetch objects: ${response.status} ${response.statusText})`
      )
    }
  }
}
