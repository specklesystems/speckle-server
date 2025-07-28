import { RingBuffer } from './RingBuffer.js'
// RingBufferState might be needed if queue logic directly manipulates or reads it.
// For now, it seems RingBuffer internals handle state.

export class RingBufferQueue {
  private ringBuffer: RingBuffer

  private lengthPrefixArray: Uint8Array // Reusable Uint8Array for length prefix
  private lengthPrefixDataView: DataView // Reusable DataView for length prefix
  private static readonly LENGTH_PREFIX_BYTES = 4 // Using 4 bytes for message length (Uint32) encoded in little-endian format
  public readonly capacityBytes: number
  private name: string

  private count: number = 0 // Count of items currently in the queue

  static create(capacityBytes: number, name: string): RingBufferQueue {
    // RingBuffer.create expects capacity in terms of elements.
    // Since we use Uint8Array, 1 byte = 1 element.
    const ringBuffer = RingBuffer.create(capacityBytes)
    return new RingBufferQueue(ringBuffer, capacityBytes, name)
  }

  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number,
    name: string
  ): RingBufferQueue {
    // RingBuffer.fromExisting expects capacity in terms of elements.
    const ringBuffer = RingBuffer.fromExisting(sharedBuffer, capacityBytes)
    return new RingBufferQueue(ringBuffer, capacityBytes, name)
  }

  private constructor(ringBuffer: RingBuffer, capacityBytes: number, name: string) {
    this.ringBuffer = ringBuffer
    this.name = name
    this.capacityBytes = capacityBytes // Store the total data capacity in bytes
    this.lengthPrefixArray = new Uint8Array(RingBufferQueue.LENGTH_PREFIX_BYTES)
    this.lengthPrefixDataView = new DataView(this.lengthPrefixArray.buffer)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.ringBuffer.getSharedArrayBuffer()
  }

  async enqueue(item: Uint8Array, timeoutMs: number): Promise<boolean> {
    const messageLength = item.length

    if (
      messageLength + RingBufferQueue.LENGTH_PREFIX_BYTES >
      this.ringBuffer.availableSpaces
    ) {
      return false
    }

    this.lengthPrefixDataView.setUint32(0, messageLength, true) // true for littleEndian
    const dataBytes = new Uint8Array(item.length + RingBufferQueue.LENGTH_PREFIX_BYTES)
    dataBytes.set(this.lengthPrefixArray, 0) // Set the length prefix at the start
    dataBytes.set(item, RingBufferQueue.LENGTH_PREFIX_BYTES) // Set the actual

    const pushedData = await this.ringBuffer.push(dataBytes, timeoutMs)
    if (!pushedData) {
      console.error(`${this.name} Failed to push length prefix to the ring buffer.`)
      return false
    }
    this.count++ // Increment the count of items in the queue
    return true
  }

  async dequeue(timeoutMs: number): Promise<Uint8Array | undefined> {
    // 1. Peek for the length prefix to see if a message is waiting.
    const lengthBytes = await this.ringBuffer.peek(
      RingBufferQueue.LENGTH_PREFIX_BYTES,
      timeoutMs
    )

    if (!lengthBytes) {
      // Timed out waiting for a message length to appear. This is normal if the queue is empty.
      return undefined
    }

    this.lengthPrefixArray.set(lengthBytes)
    const messageLength = this.lengthPrefixDataView.getUint32(0, true)

    // 2. Check if the *entire* message (prefix + data) is available to be read.
    if (this.ringBuffer.length < messageLength) {
      // Not enough data for the full message yet. Wait for it to arrive.
      const dataAppeared = await this.ringBuffer.waitForData(messageLength, timeoutMs)
      if (!dataAppeared) {
        // Timed out waiting for the full message data to appear.
        console.warn(`${this.name} Dequeue: Timed out waiting for full message data.`)
        return undefined
      }
    }

    // 3. At this point, the full message should be in the buffer. Now we can safely shift it.

    // Shift the length prefix (which we already have from peek).
    // Timeout is 0 because we know the data is there.
    await this.ringBuffer.shift(RingBufferQueue.LENGTH_PREFIX_BYTES, 0)

    if (messageLength === 0) {
      return undefined
    }

    if (messageLength > this.ringBuffer.length) {
      console.error(
        `${this.name} Dequeue: Declared message length (${messageLength} bytes) exceeds RingBuffer total space (${this.ringBuffer.length}). Possible data corruption.`
      )
      return undefined
    }

    const dataBytes = await this.ringBuffer.shift(messageLength, 0) // Timeout 0
    if (!dataBytes || dataBytes.length < messageLength) {
      console.warn(
        `${this.name} Dequeue: Received incomplete message data (got ${
          dataBytes?.length || 0
        }, expected ${messageLength} bytes). Buffer likely corrupted.`
      )
      return undefined
    }
    this.count--; // Decrement the count of items in the queue
    return dataBytes
  }

  get enqueued(): number {
    return this.count
  }
}
