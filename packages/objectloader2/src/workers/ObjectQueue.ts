import { WorkerCachingConstants } from '../caching/WorkerCachingConstants.js'
import { CustomLogger, delay } from '../types/functions.js'
import { RingBufferQueue } from './RingBufferQueue.js'
import { handleError } from './WorkerMessageType.js'

export abstract class ObjectQueue<T> {
  private rbq: RingBufferQueue
  private logger: CustomLogger

  constructor(ringBufferQueue: RingBufferQueue, logger?: CustomLogger) {
    this.rbq = ringBufferQueue
    this.logger = logger || ((): void => {})
  }

  abstract getBytes(item: T): Uint8Array
  abstract getItem(item: Uint8Array): T

  async fullyEnqueue(messages: T[], timeoutMs: number): Promise<void> {
    let remainingMessages = messages
    while (remainingMessages.length > 0) {
      const s = remainingMessages.slice(0, WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE)
      let enqueuedInChunk = 0
      while (enqueuedInChunk < s.length) {
        const actuallyEnqueued = await this.enqueue(s.slice(enqueuedInChunk), timeoutMs)
        if (actuallyEnqueued === 0) {
          // If no items were enqueued, wait before retrying to avoid a busy loop.
          /*this.logger(
            'fullyEnqueue: enqueue returned 0, waiting before retry for remaining items',
            s.length - enqueuedInChunk
          )*/
          await delay(1000)
          continue
        }
        enqueuedInChunk += actuallyEnqueued
        /*
        this.logger(
          'fullyEnqueue: enqueued',
          enqueuedInChunk,
          'of',
          s.length,
          'in current chunk'
        )*/
      }
      remainingMessages = remainingMessages.slice(s.length)
    }
  }

  async enqueue(items: T[], timeoutMs: number): Promise<number> {
    if (items.length === 0) return 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const bytes = this.getBytes(item)
        if (!(await this.rbq.enqueue(bytes, timeoutMs))) {
          return i // Return the number of successfully enqueued items
        }
      } catch (e: unknown) {
        handleError(
          e,
          (err) =>
            '[ItemQueue] Error serializing Item:' +
            err.message +
            ' ' +
            JSON.stringify(item)
        )
        return 0
      }
    }
    return items.length
  }

  async dequeue(maxItems: number, timeoutMs: number): Promise<T[]> {
    const items: T[] = []

    while (items.length < maxItems) {
      const bytes = await this.rbq.dequeue(timeoutMs)
      if (!bytes) {
        break
      }
      try {
        const item = this.getItem(bytes)
        items.push(item)
      } catch (e: unknown) {
        handleError(
          e,
          (err) =>
            '[ItemQueue] Error deserializing Item from bytes:' +
            err.message +
            ' ' +
            `Raw (hex): ${Array.from(bytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')}`
        )
      }
    }
    return items
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.rbq.getSharedArrayBuffer()
  }
}
