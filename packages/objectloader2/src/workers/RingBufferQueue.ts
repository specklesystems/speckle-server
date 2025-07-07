import { RingBuffer } from './RingBuffer.js'
// RingBufferState might be needed if queue logic directly manipulates or reads it.
// For now, it seems RingBuffer internals handle state.

export class RingBufferQueue {
  private ringBuffer: RingBuffer

  private lengthPrefixArray: Uint8Array // Reusable Uint8Array for length prefix
  private lengthPrefixDataView: DataView // Reusable DataView for length prefix
  private static readonly LENGTH_PREFIX_BYTES = 4 // Using 4 bytes for message length (Uint32)
  public readonly capacityBytes: number

  static create(capacityBytes: number): RingBufferQueue {
    // RingBuffer.create expects capacity in terms of elements.
    // Since we use Uint8Array, 1 byte = 1 element.
    const ringBuffer = RingBuffer.create(capacityBytes)
    return new RingBufferQueue(ringBuffer, capacityBytes)
  }

  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number
  ): RingBufferQueue {
    // RingBuffer.fromExisting expects capacity in terms of elements.
    const ringBuffer = RingBuffer.fromExisting(sharedBuffer, capacityBytes)
    return new RingBufferQueue(ringBuffer, capacityBytes)
  }

  private constructor(ringBuffer: RingBuffer, capacityBytes: number) {
    this.ringBuffer = ringBuffer
    this.capacityBytes = capacityBytes // Store the total data capacity in bytes
    this.lengthPrefixArray = new Uint8Array(RingBufferQueue.LENGTH_PREFIX_BYTES)
    this.lengthPrefixDataView = new DataView(this.lengthPrefixArray.buffer)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.ringBuffer.getSharedArrayBuffer()
  }

  async enqueue(items: Uint8Array[], timeoutMs: number = Infinity): Promise<boolean> {
    if (items.length === 0) {
      return true
    }
    const overallStartTime = Date.now()

    for (const dataBytes of items) {
      const itemStartTime = Date.now()
      const remainingOverallTimeout = timeoutMs - (itemStartTime - overallStartTime)
      if (remainingOverallTimeout <= 0 && timeoutMs !== Infinity) return false

      const messageLength = dataBytes.length

      if (
        messageLength + RingBufferQueue.LENGTH_PREFIX_BYTES >
        this.ringBuffer.capacity
      ) {
        console.error(
          `Message data (${messageLength} bytes) + prefix (${RingBufferQueue.LENGTH_PREFIX_BYTES} bytes) exceeds RingBuffer data capacity (${this.ringBuffer.capacity} bytes). Skipping item.`
        )
        return false
      }

      this.lengthPrefixDataView.setUint32(0, messageLength, true) // true for littleEndian

      const pushedLength = await this.ringBuffer.push(
        this.lengthPrefixArray,
        remainingOverallTimeout
      )
      if (!pushedLength) {
        return false
      }

      const dataPushTimeout = timeoutMs - (Date.now() - overallStartTime)
      if (dataPushTimeout <= 0 && timeoutMs !== Infinity) return false

      const pushedData = await this.ringBuffer.push(dataBytes, dataPushTimeout)
      if (!pushedData) {
        return false
      }
    }
    return true
  }

  async dequeue(maxItems: number, timeoutMs: number = Infinity): Promise<Uint8Array[]> {
    const dequeuedByteArrays: Uint8Array[] = []
    const overallStartTime = Date.now()

    for (let itemsRead = 0; itemsRead < maxItems; itemsRead++) {
      const loopStartTime = Date.now()
      const remainingTimeout = timeoutMs - (loopStartTime - overallStartTime)
      if (remainingTimeout <= 0 && timeoutMs !== Infinity) break

      const lengthBytes = this.ringBuffer.shift(
        RingBufferQueue.LENGTH_PREFIX_BYTES,
        remainingTimeout
      )
      if (!lengthBytes) {
        break
      }

      if (lengthBytes.length < RingBufferQueue.LENGTH_PREFIX_BYTES) {
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

      const dataShiftTimeout = timeoutMs - (Date.now() - overallStartTime)
      if (dataShiftTimeout <= 0 && timeoutMs !== Infinity) break

      const dataBytes =  this.ringBuffer.shift(messageLength, dataShiftTimeout)
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
