import { Base, Item } from '../types/types.js'
import { ObjectQueue } from '../workers/ObjectQueue.js'
import { RingBufferQueue } from '../workers/RingBufferQueue.js'

export class ItemQueue extends ObjectQueue<Item> {
  private textEncoder: TextEncoder
  private textDecoder: TextDecoder

  constructor(ringBufferQueue: RingBufferQueue) {
    super(ringBufferQueue)
    this.textEncoder = new TextEncoder()
    this.textDecoder = new TextDecoder('utf-8', { fatal: false })
  }

  getBytes(item: Item): Uint8Array {
    if (!item.baseBytes) {
      throw new Error("Item baseBytes is required for serialization");
    }
    const bytes = new Uint8Array(item.baseBytes.length + 32)
    bytes.set(item.baseBytes, 32)
    const baseIdBytes = this.textEncoder.encode(item.baseId)
    bytes.set(baseIdBytes, 0)
    return bytes
  }

  getItem(item: Uint8Array): Item {
    if (item.length < 4) {
      throw new Error("Item data is too short to contain baseId");
    }
    const baseIdBytes = item.subarray(0, 32)
    const baseId = this.textDecoder.decode(baseIdBytes)
    const baseBytes = item.subarray(32)
    return { baseId, size: baseBytes.length, base: JSON.parse(this.textDecoder.decode(baseBytes)) as Base}
  }
}
