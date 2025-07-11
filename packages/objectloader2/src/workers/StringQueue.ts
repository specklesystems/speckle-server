import { CustomLogger, delay } from '../types/functions.js'
import { RingBuffer } from './RingBuffer.js'
import { RingBufferQueue } from './RingBufferQueue.js'

export class StringQueue {
  private rbq: RingBufferQueue
  private logger: CustomLogger
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue, logger?: CustomLogger) {
    this.rbq = ringBufferQueue
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
    this.logger = logger || ((): void => {})
  }

  async fullyEnqueue(messages: string[], timeoutMs: number): Promise<void> {
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

  async enqueue(messages: string[], timeoutMs: number): Promise<number> {
    if (messages.length === 0) return 0

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      // msg is a string
      try {
        const item = this.textEncoder.encode(msg)
        if (!(await this.rbq.enqueue(item, timeoutMs))) {
          return i // Return the number of successfully enqueued messages
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error('[StringQueue] Error encoding string:', e.message, msg)
        } else {
          console.error('Caught an unknown type of error:', e)
        }
        return 0
      }
    }
    return messages.length
  }

  async dequeue(maxItems: number, timeoutMs: number): Promise<string[]> {
    const messages: string[] = [] // Array of strings

    while (messages.length < maxItems) {
      const bytes = await this.rbq.dequeue(timeoutMs)
      if (!bytes) {
        break
      }
      try {
        const decodedString = this.textDecoder.decode(bytes)
        messages.push(decodedString)
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(
            '[StringQueue] Error decoding string from bytes:',
            e.message,
            `Raw (hex): ${Array.from(bytes)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')}`
          )
        } else {
          console.error('Caught an unknown type of error:', e)
        }
      }
    }
    return messages
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.rbq.getSharedArrayBuffer()
  }
}
