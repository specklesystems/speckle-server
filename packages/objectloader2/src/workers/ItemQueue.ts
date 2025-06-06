import { Item } from '../types/types.js'
import { RingBufferQueue } from './RingBufferQueue.js'
import { handleError } from './WorkerMessageType.js'

export class ItemQueue {
  private rbq: RingBufferQueue
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue) {
    this.rbq = ringBufferQueue
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
  }

  async enqueue(items: Item[], timeoutMs: number = Infinity): Promise<boolean> {
    if (items.length === 0) return true

    const byteArrays: Uint8Array[] = []
    for (const item of items) {
      try {
        const jsonString = JSON.stringify(item)
        byteArrays.push(this.textEncoder.encode(jsonString))
      } catch (e: unknown) {
        handleError(
          e,
          (err) =>
            '[ItemQueue] Error serializing Item:' +
            err.message +
            ' ' +
            JSON.stringify(item)
        )
        return false
      }
    }
    return this.rbq.enqueue(byteArrays, timeoutMs)
  }

  async dequeue(maxItems: number, timeoutMs: number = Infinity): Promise<Item[]> {
    const byteArrays = await this.rbq.dequeue(maxItems, timeoutMs)
    const items: Item[] = []

    for (const byteArray of byteArrays) {
      try {
        const jsonString = this.textDecoder.decode(byteArray)
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
            `Raw (hex): ${Array.from(byteArray)
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
