import { ITransport } from './ITransport'
import { IDisposable } from '../utils/IDisposable'
import { retry, timeoutAt, TIME_MS } from '@speckle/shared'

export type TransportOptions = Partial<{
  maxSize: number
  flushRetryCount: number
  flushTimeout: number
}>

/**
 * Basic object sender to a speckle server
 */
export class ServerTransport implements ITransport, IDisposable {
  #buffer: [string, string][]
  #maxSize: number
  #currSize: number
  #serverUrl: string
  #projectId: string
  #authToken: string
  #flushRetryCount: number
  #flushTimeout: number

  constructor(
    serverUrl: string,
    projectId: string,
    authToken: string,
    options?: TransportOptions
  ) {
    this.#maxSize = options?.maxSize || 200_000
    this.#flushRetryCount = options?.flushRetryCount || 3
    this.#flushTimeout = options?.flushTimeout || 2 * TIME_MS.minute

    this.#currSize = 0
    this.#serverUrl = serverUrl
    this.#projectId = projectId
    this.#authToken = authToken
    this.#buffer = []
  }

  async write(serialisedObject: string, size: number, objectId: string) {
    this.#buffer.push([objectId, serialisedObject])
    this.#currSize += size
    if (this.#currSize < this.#maxSize) return // return fast
    await this.flush() // block until we send objects
  }

  async flush() {
    if (this.#buffer.length === 0) return

    const speckleObjects = await this.diff()
    const formData = new FormData()
    const concat = '[' + speckleObjects.join(',') + ']'
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
        return i * TIME_MS.second
      }
    )

    if (res.status !== 201) {
      throw new Error(
        `Unexpected error when sending data. Expected status 200, got ${res.status}`
      )
    }

    this.#buffer = []
    this.#currSize = 0
  }

  async diff() {
    const objectIds = this.#buffer.map(([id]) => id)

    const url = new URL(`/api/diff/${this.#projectId}`, this.#serverUrl)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.#authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ objects: JSON.stringify(objectIds) })
    })

    if (!response.ok) {
      const data = (await response.json()) as { error: Error }
      throw new Error(
        `Unexpected error when sending data. Received ${data.error.message}`
      )
    }

    const existingObjects = (await response.json()) as Record<string, boolean>

    return this.#buffer.filter(([id]) => !existingObjects[id]).map(([, value]) => value)
  }

  dispose() {
    this.#buffer = []
  }
}
