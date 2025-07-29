import { CustomLogger } from '../types/functions.js'
import { Base, Item } from '../types/types.js'
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
    if (!item.baseBytes) {
      throw new Error("Item baseBytes is required for serialization");
    }
    return item.baseBytes
  }

  getItem(item: Uint8Array): Item {
    if (item.length < 4) {
      throw new Error("Item data is too short to contain baseId");
    }
    const base = JSON.parse(this.textDecoder.decode(item)) as Base;
    return { baseId: base.id, size: item.length, base };
  }
}
