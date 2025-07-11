import { RingBufferQueue } from './RingBufferQueue.js'

export class StringQueue {
  private rbq: RingBufferQueue
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue) {
    this.rbq = ringBufferQueue
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
  }

  async enqueue(messages: string[], timeoutMs: number): Promise<number> {
    if (messages.length === 0) return 0

    const byteArrays: Uint8Array[] = []
    for (const msg of messages) {
      // msg is a string
      try {
        byteArrays.push(this.textEncoder.encode(msg))
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error('[StringQueue] Error encoding string:', e.message, msg)
        } else {
          console.error('Caught an unknown type of error:', e)
        }
        return 0
      }
    }
    return this.rbq.enqueue(byteArrays, timeoutMs)
  }

  async dequeue(maxItems: number, timeoutMs: number): Promise<string[]> {
    const byteArrays = await this.rbq.dequeue(maxItems, timeoutMs)
    const messages: string[] = [] // Array of strings

    for (const byteArray of byteArrays) {
      try {
        const decodedString = this.textDecoder.decode(byteArray)
        messages.push(decodedString)
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(
            '[StringQueue] Error decoding string from bytes:',
            e.message,
            `Raw (hex): ${Array.from(byteArray)
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
