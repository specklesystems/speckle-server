import { delay } from '../types/functions.js'
import { RingBufferQueue } from './RingBufferQueue.js'
import { WorkerRingBuffer } from './WorkerRingBuffer.js'
// RingBufferState might be needed if queue logic directly manipulates or reads it.
// For now, it seems RingBuffer internals handle state.

export class WorkerRingBufferQueue implements RingBufferQueue {
  private ringBuffer: WorkerRingBuffer

  private lengthPrefixArray: Uint8Array // Reusable Uint8Array for length prefix
  private lengthPrefixDataView: DataView // Reusable DataView for length prefix
  private static readonly LENGTH_PREFIX_BYTES = 4 // Using 4 bytes for message length (Uint32)
  public readonly capacityBytes: number
  private name: string

  static create(capacityBytes: number, name: string): WorkerRingBufferQueue {
    // RingBuffer.create expects capacity in terms of elements.
    // Since we use Uint8Array, 1 byte = 1 element.
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)
    return new WorkerRingBufferQueue(ringBuffer, capacityBytes, name)
  }

  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number,
    name: string
  ): WorkerRingBufferQueue {
    // RingBuffer.fromExisting expects capacity in terms of elements.
    const ringBuffer = WorkerRingBuffer.fromExisting(sharedBuffer, capacityBytes)
    return new WorkerRingBufferQueue(ringBuffer, capacityBytes, name)
  }

  private constructor(
    ringBuffer: WorkerRingBuffer,
    capacityBytes: number,
    name: string
  ) {
    this.ringBuffer = ringBuffer
    this.name = name
    this.capacityBytes = capacityBytes // Store the total data capacity in bytes
    this.lengthPrefixArray = new Uint8Array(WorkerRingBufferQueue.LENGTH_PREFIX_BYTES)
    this.lengthPrefixDataView = new DataView(this.lengthPrefixArray.buffer)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.ringBuffer.getSharedArrayBuffer()
  }

  enqueue(items: Uint8Array[], timeoutMs: number = Infinity): Promise<boolean> {
    if (items.length === 0) {
      return Promise.resolve(true)
    }

    for (const dataBytes of items) {
      const messageLength = dataBytes.length

      if (
        messageLength + WorkerRingBufferQueue.LENGTH_PREFIX_BYTES >
        this.ringBuffer.capacity
      ) {
        console.error(
          `Message data (${messageLength} bytes) + prefix (${WorkerRingBufferQueue.LENGTH_PREFIX_BYTES} bytes)
          exceeds RingBuffer data capacity (${this.ringBuffer.capacity} bytes). Skipping item as message is too large.`
        )
        return Promise.resolve(false)
      }

      this.lengthPrefixDataView.setUint32(0, messageLength, true) // true for littleEndian

      const pushedLength = this.ringBuffer.push(this.lengthPrefixArray, timeoutMs)
      if (!pushedLength) {
        return Promise.resolve(false)
      }

      const pushedData = this.ringBuffer.push(dataBytes, timeoutMs)
      if (!pushedData) {
        return Promise.resolve(false)
      }
    }
    console.log(`Enqueued ${items.length} items to ${this.name} queue.`)
    return Promise.resolve(true)
  }

  dequeue(maxItems: number, timeoutMs: number = Infinity): Promise<Uint8Array[]> {
    const dequeuedByteArrays: Uint8Array[] = []

    for (let itemsRead = 0; itemsRead < maxItems; itemsRead++) {
      const lengthBytes = this.ringBuffer.shift(
        WorkerRingBufferQueue.LENGTH_PREFIX_BYTES,
        timeoutMs
      )
      if (!lengthBytes) {
        break
      }

      if (lengthBytes.length < WorkerRingBufferQueue.LENGTH_PREFIX_BYTES) {
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

      const dataBytes = this.ringBuffer.shift(messageLength, timeoutMs)
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
    if (dequeuedByteArrays.length > 0) {
      console.log(
        `Dequeued ${dequeuedByteArrays.length} items from ${this.name} queue.`
      )
    }
    return Promise.resolve(dequeuedByteArrays)
  }
}
