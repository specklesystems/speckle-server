import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { isBase, Item } from '../types/types.js'
import { ICache, IDownloader } from './interfaces.js'
import { BaseDownloadOptions } from './options.js'

export default class Downloader implements IDownloader {
  #serverUrl: string
  #streamId: string
  #objectId: string
  #token?: string
  #requestUrlRootObj: string
  #requestUrlChildren: string
  #headers: HeadersInit
  #options: BaseDownloadOptions

  #database: ICache
  #downloadQueue: BatchingQueue<string>
  #results: Queue<Item>

  constructor(
    database: ICache,
    results: Queue<Item>,
    serverUrl: string,
    streamId: string,
    objectId: string,
    token?: string,
    options?: Partial<BaseDownloadOptions>
  ) {
    this.#database = database
    this.#results = results

    this.#serverUrl = serverUrl
    this.#streamId = streamId
    this.#objectId = objectId
    this.#token = token
    this.#options = {
      ...{
        fetch: (...args) => globalThis.fetch(...args),
        batchMaxSize: 5000,
        batchMaxWait: 1000
      },
      ...options
    }
    this.#downloadQueue = new BatchingQueue<string>(
      this.#options.batchMaxSize,
      this.#options.batchMaxWait,
      (batch: string[]) =>
        this.downloadBatch(
          batch,
          this.#requestUrlChildren,
          this.#headers,
          this.#results
        )
    )

    this.#headers = {
      Accept: 'text/plain'
    }

    if (this.#token) {
      this.#headers['Authorization'] = `Bearer ${this.#token}`
    }
    this.#requestUrlChildren = `${this.#serverUrl}/api/getobjects/${this.#streamId}`
    this.#requestUrlRootObj = `${this.#serverUrl}/objects/${this.#streamId}/${
      this.#objectId
    }/single`
  }

  add(id: string): void {
    this.#downloadQueue.add(id)
  }

  async finish(): Promise<void> {
    await this.#downloadQueue.finish()
  }

  #processJson(baseId: string, unparsedBase: string): Item {
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
    const response = await this.#options.fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects: JSON.stringify(idBatch) })
    })

    this.#validateResponse(response)
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
          const item = this.#processJson(id, unparsedObj)
          await this.#database.write(item)
          results.add(item)
        }
      }
    }
  }

  async downloadSingle(): Promise<Item> {
    const response = await this.#options.fetch(this.#requestUrlRootObj, {
      headers: this.#headers
    })
    this.#validateResponse(response)
    const responseText = await response.text()
    const item = this.#processJson(this.#objectId, responseText)
    return item
  }

  #validateResponse(response: Response): void {
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
