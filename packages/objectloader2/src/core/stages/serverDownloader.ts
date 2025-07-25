import BatchedPool from '../../queues/batchedPool.js'
import Queue from '../../queues/queue.js'
import { ObjectLoaderRuntimeError } from '../../types/errors.js'
import { Fetcher, indexOf, isBase, take } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { Downloader } from '../interfaces.js'

export interface ServerDownloaderOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers
  fetch?: Fetcher
}

const MAX_SAFARI_DECODE_BYTES = 2 * 1024 * 1024 * 1024 - 1024 * 1024 // 2GB minus a margin

export default class ServerDownloader implements Downloader {
  #requestUrlRootObj: string
  #requestUrlChildren: string
  #headers: HeadersInit
  #options: ServerDownloaderOptions
  #fetch: Fetcher
  #results?: Queue<Item>
  #total?: number

  #downloadQueue?: BatchedPool<string>
  #decoder = new TextDecoder('utf-8', { fatal: true })
  #decodedBytesCount = 0

  #rawString: string = 'Objects.Other.RawEncoding'
  #rawEncoding: Uint8Array

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

    const encoder = new TextEncoder()
    this.#rawEncoding = encoder.encode(this.#rawString)
  }

  #getDownloadCountAndSizes(total: number): number[] {
    if (total <= 50) {
      return [total]
    }

    return [10000, 25000, 10000, 1000]
  }

  initializePool(params: {
    results: Queue<Item>
    total: number
    maxDownloadBatchWait?: number
  }): void {
    const { results, total } = params
    this.#results = results
    this.#total = total
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

  /*
  This is the most frequently reported and confirmed reason for this error in Safari. There's a known bug in WebKit (Safari's rendering engine) where TextDecoder can fail or throw a RangeError after decoding around 2GB of data. Chrome and other browsers handle much larger amounts of data without this specific limitation.

Why it happens: It seems to be an internal memory or indexing limitation within Safari's TextDecoder implementation. After a certain threshold of data has been processed by a TextDecoder instance, it starts throwing this error.

Chrome's behavior: Chrome generally handles larger data sizes without this specific RangeError. It might become slow or run out of general memory, but not typically with this specific error.
  */
  decodeChunk(chunkBuffer: Uint8Array): string {
    if (this.#decodedBytesCount + chunkBuffer.byteLength > MAX_SAFARI_DECODE_BYTES) {
      // Safari is approaching its limit, create a new decoder
      this.#decoder = new TextDecoder('utf-8', { fatal: true })
      this.#decodedBytesCount = 0 // Reset counter for the new decoder
    }
    const decodedText = this.#decoder.decode(chunkBuffer)
    this.#decodedBytesCount += chunkBuffer.byteLength
    return decodedText
  }

  async disposeAsync(): Promise<void> {
    await this.#downloadQueue?.disposeAsync()
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
    count += keys.size // count the leftovers
    if (count >= this.#total!) {
      await this.#results?.disposeAsync() // mark the queue as done
    }
  }

  async processArray(
    leftover: Uint8Array,
    value: Uint8Array,
    keys: Set<string>,
    callback: () => Promise<void>
  ): Promise<Uint8Array> {
    //this concat will allocate a new array
    const combined = this.#concatUint8Arrays(leftover, value)
    let start = 0

    //subarray doesn't allocate
    for (let i = 0; i < combined.length; i++) {
      if (combined[i] === 0x0a) {
        const line = combined.subarray(start, i) // line without \n
        //strings are allocated here
        const item = this.#processLine(line)
        start = i + 1
        await callback()
        keys.delete(item.baseId)
        if (!item.base) {
          continue
        }
        this.#results?.add(item)
      }
    }
    return combined.subarray(start) // carry over remainder
  }

  #processLine(line: Uint8Array): Item {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === 0x09) {
        //this is a tab
        const baseId = this.decodeChunk(line.subarray(0, i))
        const jsonBytes = line.subarray(i + 1)

        if (!this.#isValidBytes(jsonBytes)) {
          return { baseId, base: undefined }
        }
        const base = this.decodeChunk(jsonBytes)
        const item = this.#processJson(baseId, base)
        item.size = jsonBytes.length
        return item
      }
    }
    throw new ObjectLoaderRuntimeError(
      'Invalid line format in response: ' + this.decodeChunk(line)
    )
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
  #isValidString(json: string): boolean {
    if (!json.includes('Objects.Other.RawEncoding')) {
      return true
    }
    return false
  }

  #isValidBytes(json: Uint8Array): boolean {
    if (indexOf(json, this.#rawEncoding) === -1) {
      return true
    }
    return false
  }

  #concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length)
    c.set(a, 0)
    c.set(b, a.length)
    return c
  }

  async downloadSingle(): Promise<Item | undefined> {
    const response = await this.#fetch(this.#requestUrlRootObj, {
      headers: this.#headers
    })
    this.#validateResponse(response)
    const responseText = await response.text()
    if (!this.#isValidString(responseText)) {
      return undefined
    }
    const item = this.#processJson(this.#options.objectId, responseText)
    if (!item.base) {
      return undefined
    }
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
