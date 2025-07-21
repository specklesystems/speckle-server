import { CustomLogger } from '../types/functions.js'
import { Item } from '../types/types.js'
import { ObjectQueue } from '../workers/ObjectQueue.js'
import { RingBufferQueue } from '../workers/RingBufferQueue.js'

export class ItemQueue extends ObjectQueue<Item> {
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue, logger?: CustomLogger) {
    super(ringBufferQueue, logger)
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
  }

  getBytes(item: Item): Uint8Array {
    return this.textEncoder.encode(JSON.stringify(item))
  }

  getItem(item: Uint8Array): Item {
    return JSON.parse(this.textDecoder.decode(item)) as Item
  }
}
