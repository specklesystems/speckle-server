import AsyncGeneratorQueue from '../helpers/asyncGeneratorQueue.js'
import BatchingQueue from '../helpers/batchingQueue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { Base, CustomLogger, isBase, Item } from '../types/types.js'

export default class Downloader {
  private _logger: CustomLogger

  private _serverUrl: string
  private _streamId: string
  private _token?: string
  private _requestUrlChildren: string
  private _headers: HeadersInit

  private _idQueue: BatchingQueue<string>
  //private _activeReaders = 0
  //private _readerPoolSize = 5

  private _results: AsyncGeneratorQueue<Item>

  constructor(
    results: AsyncGeneratorQueue<Item>,
    logger: CustomLogger,
    serverUrl: string,
    streamId: string,
    token?: string
  ) {
    this._results = results
    this._logger = logger

    this._serverUrl = serverUrl
    this._streamId = streamId
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
  }

  async setItems(ids: string[]): Promise<void> {
    await this._idQueue.setQueue(ids)
  }

  async add(id: string): Promise<void> {
    await this._idQueue.add(id)
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

        try {
          const pair = jsonString.split('\t')
          const obj = JSON.parse(pair[1])
          if (isBase(obj)) {
            throw new ObjectLoaderRuntimeError('json is not a base')
          }
          const b = obj as Base
          results.add({ id: b.id, obj: b })
        } catch (error) {
          console.warn('Partial JSON, waiting for more data...')
        }
      }
    } while (!allDone)

    console.log('Download and parsing complete.')
  }
}
