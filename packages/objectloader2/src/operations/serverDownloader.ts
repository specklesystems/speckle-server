import BatchedPool from '../helpers/batchedPool.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { Fetcher, isBase, Item } from '../types/types.js'
import { Downloader } from './interfaces.js'
import { BaseDownloadOptions } from './options.js'

export default class ServerDownloader implements Downloader {
  #requestUrlRootObj: string
  #requestUrlChildren: string
  #headers: HeadersInit
  #options: BaseDownloadOptions
  #fetch: Fetcher

  #downloadQueue?: BatchedPool<string>

  constructor(options: BaseDownloadOptions) {
    this.#options = options
    this.#fetch = options.fetch ?? ((...args) => globalThis.fetch(...args))

    this.#headers = {}
    if (options.headers) {
      for (const header of options.headers.entries()) {
        this.#headers[header[0]] = header[1]
      }
    }
    this.#headers['Accept'] = `text/plain`

    if (this.#options.token) {
      this.#headers['Authorization'] = `Bearer ${this.#options.token}`
    }
    this.#requestUrlChildren = `${this.#options.serverUrl}/api/getobjects/${
      this.#options.streamId
    }`
    this.#requestUrlRootObj = `${this.#options.serverUrl}/objects/${
      this.#options.streamId
    }/${this.#options.objectId}/single`
  }

  #getDownloadCountAndSizes(total: number): number[] {
    if (total <= 50) {
      return [total]
    }

    return [10000, 30000, 10000, 1000]
  }

  initializePool(params: { total: number; maxDownloadBatchWait?: number }) {
    const { total } = params
    this.#downloadQueue = new BatchedPool<string>({
      concurrencyAndSizes: this.#getDownloadCountAndSizes(total),
      maxWaitTime: params.maxDownloadBatchWait,
      processFunction: (batch: string[]) =>
        this.downloadBatch({
          batch,
          url: this.#requestUrlChildren,
          headers: this.#headers,
          results: this.#options.results
        })
    })
  }

  #getPool(): BatchedPool<string> {
    if (this.#downloadQueue) {
      return this.#downloadQueue
    }
    throw new Error('Download pool is not initialized')
  }

  add(id: string): void {
    this.#getPool().add(id)
  }

  async disposeAsync(): Promise<void> {
    await this.#downloadQueue?.disposeAsync()
    await this.#getPool().disposeAsync()
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

  async downloadBatch(params: {
    batch: string[]
    url: string
    headers: HeadersInit
    results: Queue<Item>
  }): Promise<void> {
    const { batch, url, headers, results } = params
    const response = await this.#fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects: JSON.stringify(batch) })
    })

    this.#validateResponse(response)
    if (!response.body) {
      throw new Error('ReadableStream not supported or response has no body.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // Temporary buffer to store incoming chunks

    let count = 0
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
          await this.#options.database.add(item)
          results.add(item)
          count++
          if (count % 1000 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 100)) //allow other stuff to happen
          }
        }
      }
    }
  }

  async downloadSingle(): Promise<Item> {
    const response = await this.#fetch(this.#requestUrlRootObj, {
      headers: this.#headers
    })
    this.#validateResponse(response)
    const responseText = await response.text()
    const item = this.#processJson(this.#options.objectId, responseText)
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
