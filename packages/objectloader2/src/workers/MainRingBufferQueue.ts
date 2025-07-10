import { MainRingBuffer } from './MainRingBuffer.js'
import { RingBufferQueue } from './RingBufferQueue.js'
// RingBufferState might be needed if queue logic directly manipulates or reads it.
// For now, it seems RingBuffer internals handle state.

export class MainRingBufferQueue implements RingBufferQueue {
  private ringBuffer: MainRingBuffer

  private lengthPrefixArray: Uint8Array // Reusable Uint8Array for length prefix
  private lengthPrefixDataView: DataView // Reusable DataView for length prefix
  private static readonly LENGTH_PREFIX_BYTES = 4 // Using 4 bytes for message length (Uint32)
  public readonly capacityBytes: number
  private name: string

  static create(capacityBytes: number, name: string): MainRingBufferQueue {
    // RingBuffer.create expects capacity in terms of elements.
    // Since we use Uint8Array, 1 byte = 1 element.
    const ringBuffer = MainRingBuffer.create(capacityBytes)
    return new MainRingBufferQueue(ringBuffer, capacityBytes, name)
  }

  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number,
    name: string
  ): MainRingBufferQueue {
    // RingBuffer.fromExisting expects capacity in terms of elements.
    const ringBuffer = MainRingBuffer.fromExisting(sharedBuffer, capacityBytes)
    return new MainRingBufferQueue(ringBuffer, capacityBytes, name)
  }

  private constructor(ringBuffer: MainRingBuffer, capacityBytes: number, name: string) {
    this.ringBuffer = ringBuffer
    this.name = name
    this.capacityBytes = capacityBytes // Store the total data capacity in bytes
    this.lengthPrefixArray = new Uint8Array(MainRingBufferQueue.LENGTH_PREFIX_BYTES)
    this.lengthPrefixDataView = new DataView(this.lengthPrefixArray.buffer)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.ringBuffer.getSharedArrayBuffer()
  }

  async enqueue(items: Uint8Array[], timeoutMs: number = Infinity): Promise<boolean> {
    if (items.length === 0) {
      return true
    }

    for (const dataBytes of items) {
      const messageLength = dataBytes.length

      if (
        messageLength + MainRingBufferQueue.LENGTH_PREFIX_BYTES >
        this.ringBuffer.capacity
      ) {
        console.error(
          `Message data (${messageLength} bytes) + prefix (${MainRingBufferQueue.LENGTH_PREFIX_BYTES} bytes) exceeds RingBuffer data capacity (${this.ringBuffer.capacity} bytes). Skipping item.`
        )
        return false
      }

      this.lengthPrefixDataView.setUint32(0, messageLength, true) // true for littleEndian

      const pushedLength = await this.ringBuffer.push(this.lengthPrefixArray, timeoutMs)
      if (!pushedLength) {
        return false
      }

      const pushedData = await this.ringBuffer.push(dataBytes, timeoutMs)
      if (!pushedData) {
        return false
      }
    }
    return true
  }

  async dequeue(maxItems: number, timeoutMs: number = Infinity): Promise<Uint8Array[]> {
    const dequeuedByteArrays: Uint8Array[] = []

    for (let itemsRead = 0; itemsRead < maxItems; itemsRead++) {
      const lengthBytes = await this.ringBuffer.shift(
        MainRingBufferQueue.LENGTH_PREFIX_BYTES,
        timeoutMs
      )
      if (!lengthBytes) {
        break
      }

      if (lengthBytes.length < MainRingBufferQueue.LENGTH_PREFIX_BYTES) {
        console.warn(
          'Dequeue: Received incomplete length prefix. Buffer might be corrupted or in inconsistent state.'
        )
        break
      }

      this.lengthPrefixArray.set(lengthBytes)
      const messageLength = this.lengthPrefixDataView.getUint32(0, true)

      if (messageLength === 0) {
        dequeuedByteArrays.push(new Uint8Array(0))
        continue
      }

      if (messageLength > this.ringBuffer.capacity) {
        console.error(
          `Dequeue: Declared message length (${messageLength} bytes) exceeds RingBuffer data capacity (${this.ringBuffer.capacity}). Possible data corruption.`
        )
        break
      }

      const dataBytes = await this.ringBuffer.shift(messageLength, timeoutMs)
      if (!dataBytes) {
        break
      }
      if (dataBytes.length < messageLength) {
        console.warn(
          `Dequeue: Received incomplete message data (got ${dataBytes.length}, expected ${messageLength} bytes). Buffer likely corrupted or write was interrupted.`
        )
        break
      }
      dequeuedByteArrays.push(dataBytes)
    }
    return dequeuedByteArrays
  }
}
