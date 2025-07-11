import { CustomLogger } from '../types/functions.js'
import { ObjectQueue } from './ObjectQueue.js'
import { RingBufferQueue } from './RingBufferQueue.js'

export class StringQueue extends ObjectQueue<string> {
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue, logger?: CustomLogger) {
    super(ringBufferQueue, logger)
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
  }

  getBytes(item: string): Uint8Array {
    return this.textEncoder.encode(item)
  }

  getItem(item: Uint8Array): string {
    return this.textDecoder.decode(item)
  }
}
