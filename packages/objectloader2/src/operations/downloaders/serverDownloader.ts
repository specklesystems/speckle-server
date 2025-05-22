import BatchedPool from '../../helpers/batchedPool.js'
import Queue from '../../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../../types/errors.js'
import { Fetcher, isBase, Item, take } from '../../types/types.js'
import { Downloader } from '../interfaces.js'

export interface ServerDownloaderOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers
  fetch?: Fetcher
}

export default class ServerDownloader implements Downloader {
  #requestUrlRootObj: string
  #requestUrlChildren: string
  #headers: HeadersInit
  #options: ServerDownloaderOptions
  #fetch: Fetcher
  #results?: Queue<Item>

  #downloadQueue?: BatchedPool<string>
  #decoder = new TextDecoder()

  constructor(options: ServerDownloaderOptions) {
    this.#options = options
    this.#fetch =
      options.fetch ?? ((...args): Promise<Response> => globalThis.fetch(...args))

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

  initializePool(params: {
    results: Queue<Item>
    total: number
    maxDownloadBatchWait?: number
  }): void {
    const { results, total } = params
    this.#results = results
    this.#downloadQueue = new BatchedPool<string>({
      concurrencyAndSizes: this.#getDownloadCountAndSizes(total),
      maxWaitTime: params.maxDownloadBatchWait,
      processFunction: (batch: string[]): Promise<void> =>
        this.downloadBatch({
          batch,
          url: this.#requestUrlChildren,
          headers: this.#headers
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
  }): Promise<void> {
    const { batch, url, headers } = params
    const keys = new Set<string>(batch)
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
    let leftover = new Uint8Array(0)

    let count = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      leftover = await this.processArray(leftover, value, keys, async () => {
        count++
        if (count % 1000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100)) //allow other stuff to happen
        }
      })
    }
    if (keys.size > 0) {
      throw new Error(
        'Items requested were not downloaded: ' + take(keys.values(), 10).join(',')
      )
    }
  }

  async processArray(
    leftover: Uint8Array,
    value: Uint8Array,
    keys: Set<string>,
    callback: () => Promise<void>
  ): Promise<Uint8Array> {
    //this concat will allocate a new array
    const combined = this.concatUint8Arrays(leftover, value)
    let start = 0

    //subarray doesn't allocate
    for (let i = 0; i < combined.length; i++) {
      if (combined[i] === 0x0a) {
        const line = combined.subarray(start, i) // line without \n
        //strings are allocated here
        const item = this.processLine(line)
        this.#results?.add(item)
        start = i + 1
        await callback()
        keys.delete(item.baseId)
      }
    }
    return combined.subarray(start) // carry over remainder
  }

  processLine(line: Uint8Array): Item {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === 0x09) {
        //this is a tab
        const baseId = this.#decoder.decode(line.subarray(0, i))
        const json = line.subarray(i + 1)
        const base = this.#decoder.decode(json)
        const item = this.#processJson(baseId, base)
        item.size = json.length
        return item
      }
    }
    throw new ObjectLoaderRuntimeError(
      'Invalid line format: ' + this.#decoder.decode(line)
    )
  }

  concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length)
    c.set(a, 0)
    c.set(b, a.length)
    return c
  }

  async downloadSingle(): Promise<Item> {
    const response = await this.#fetch(this.#requestUrlRootObj, {
      headers: this.#headers
    })
    this.#validateResponse(response)
    const responseText = await response.text()
    const item = this.#processJson(this.#options.objectId, responseText)
    item.size = 0
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
