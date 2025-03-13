import BaseDatabase from './BaseDatabase.js'
import { BatchProcessor } from './BatchProcessor.js'
import { chunk, CustomLogger, Item } from './types.js'

class BaseDownloader {
  private _logger: CustomLogger

  private _serverUrl: string
  private _streamId: string
  private _token?: string
  private _requestUrlChildren: string
  private _headers: HeadersInit

  private _idQueue: BatchProcessor<string>
  //private _activeReaders = 0
  //private _readerPoolSize = 5

  constructor(
    logger: CustomLogger,
    serverUrl: string,
    streamId: string,
    token?: string
  ) {
    this._logger = logger

    this._serverUrl = serverUrl
    this._streamId = streamId
    this._token = token
    this._idQueue = new BatchProcessor<string>(200, 1000, this.downloadBatch)

    this._headers = {
      Accept: 'text/plain'
    }

    if (this._token) {
      this._headers['Authorization'] = `Bearer ${this._token}`
    }
    this._requestUrlChildren = `${this._serverUrl}/api/getobjects/${this._streamId}`
  }

  async add(id: string): Promise<void> {
    this._idQueue.add(id)
  }

  async downloadBatch(idBatch: string[]): Promise<void> {
    const response = await fetch(this._requestUrlChildren, {
      method: 'POST',
      headers: { ...this._headers, 'Content-Type': 'application/json' },
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
      let boundary = buffer.lastIndexOf('}')
      if (boundary !== -1) {
        let jsonString = buffer.substring(0, boundary + 1) // Extract complete JSON part
        buffer = buffer.substring(boundary + 1) // Keep the rest for the next chunk

        try {
          const json = JSON.parse(jsonString)
          this._logger('Parsed JSON:', json)
        } catch (error) {
          console.warn('Partial JSON, waiting for more data...')
        }
      }
    }

    console.log('Download and parsing complete.')
  }
}
