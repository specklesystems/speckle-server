import type { ITransport } from './ITransport'
import type { IDisposable } from '../utils/IDisposable'
import { retry, timeoutAt } from '@speckle/shared'
import type { Logger } from '../index'

/**
 * Basic object sender to a speckle server
 */
export class ServerTransport implements ITransport, IDisposable {
  #buffer: string[]
  #maxSize: number
  #currSize: number
  #serverUrl: string
  #projectId: string
  #authToken: string
  #flushRetryCount: number
  #flushTimeout: number
  #logger: Logger | undefined

  constructor(params: {
    serverUrl: string
    projectId: string
    authToken: string
    options?: Partial<{
      maxSize: number
      flushRetryCount: number
      flushTimeout: number
    }>
    logger?: Logger
  }) {
    const { serverUrl, projectId, authToken, options, logger } = params
    this.#maxSize = options?.maxSize || 200_000
    this.#flushRetryCount = options?.flushRetryCount || 3
    this.#flushTimeout = options?.flushTimeout || 2 * 60 * 1000

    this.#currSize = 0
    this.#serverUrl = serverUrl
    this.#projectId = projectId
    this.#authToken = authToken
    this.#buffer = []
    this.#logger = logger
  }

  async write(serialisedObject: string, size: number) {
    this.#buffer.push(serialisedObject)
    this.#currSize += size
    if (this.#currSize < this.#maxSize) return // return fast
    await this.flush() // block until we send objects
  }

  async flush() {
    if (this.#buffer.length === 0) return

    this.#logger?.debug(
      `Flushing ${this.#buffer.length} objects of size ${
        this.#currSize
      } bytes to server`
    )
    const formData = new FormData()
    const concat = `[${this.#buffer.join(',')}]`
    formData.append('object-batch', new Blob([concat], { type: 'application/json' }))
    const url = new URL(`/objects/${this.#projectId}`, this.#serverUrl)
    const res = await retry(
      async () =>
        await Promise.race([
          fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.#authToken}` },
            body: formData
          }),
          timeoutAt(this.#flushTimeout, 'Object sender flush timed out')
        ]),
      this.#flushRetryCount,
      (i) => {
        return i * 1000
      }
    )

    this.#logger?.debug(
      `Flushed ${this.#buffer.length} objects of size ${
        this.#currSize
      } bytes to server. Received status '${res.status}', with message '${
        res.statusText
      }'`
    )

    if (res.status !== 201) {
      throw new Error(
        `Unexpected error when sending data. Expected status 200, got ${res.status}`
      )
    }

    this.#buffer = []
    this.#currSize = 0
  }

  dispose() {
    this.#buffer = []
    this.#logger = undefined
  }
}
