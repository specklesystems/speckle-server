import { CustomLogger, delay } from '../types/functions.js'
import { Item } from '../types/types.js'
import { RingBuffer } from './RingBuffer.js'
import { MainRingBufferQueue } from './MainRingBufferQueue.js'
import { handleError } from './WorkerMessageType.js'

export class ItemQueue {
  private rbq: MainRingBufferQueue
  private logger: CustomLogger
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: MainRingBufferQueue, logger?: CustomLogger) {
    this.rbq = ringBufferQueue
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
    this.logger = logger || ((): void => {})
  }

  async fullyEnqueue(messages: Item[], timeoutMs: number): Promise<void> {
    let remainingMessages = messages
    while (remainingMessages.length > 0) {
      const s = remainingMessages.slice(0, RingBuffer.DEFAULT_ENQUEUE_SIZE)
      let enqueuedInChunk = 0
      while (enqueuedInChunk < s.length) {
        const actuallyEnqueued = await this.enqueue(s.slice(enqueuedInChunk), timeoutMs)
        if (actuallyEnqueued === 0) {
          // If no items were enqueued, wait before retrying to avoid a busy loop.
          this.logger(
            'fullyEnqueue: enqueue returned 0, waiting before retry for remaining items',
            s.length - enqueuedInChunk
          )
          await delay(1000)
          continue
        }
        enqueuedInChunk += actuallyEnqueued
        this.logger(
          'fullyEnqueue: enqueued',
          enqueuedInChunk,
          'of',
          s.length,
          'in current chunk'
        )
      }
      remainingMessages = remainingMessages.slice(s.length)
    }
  }

  async enqueue(items: Item[], timeoutMs: number): Promise<number> {
    if (items.length === 0) return 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const jsonString = JSON.stringify(item)
        const bytes = this.textEncoder.encode(jsonString)
        if (!(await this.rbq.enqueue(bytes, timeoutMs))) {
          return i // Return the number of successfully
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

  async dequeue(maxItems: number, timeoutMs: number): Promise<Item[]> {
    const items: Item[] = []

    while (items.length < maxItems) {
      const bytes = await this.rbq.dequeue(timeoutMs)
      if (!bytes) {
        break
      }
      try {
        const jsonString = this.textDecoder.decode(bytes)
        const item = JSON.parse(jsonString) as Item
        // Basic validation
        if (
          item &&
          typeof item.baseId === 'string' &&
          item.base &&
          typeof item.base.id === 'string'
        ) {
          items.push(item)
        } else {
          console.warn(
            '[ItemQueue] Dequeued object does not match Item structure:',
            item
          )
        }
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
