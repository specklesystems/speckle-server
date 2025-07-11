import { MainRingBuffer } from './MainRingBuffer.js'
// RingBufferState might be needed if queue logic directly manipulates or reads it.
// For now, it seems RingBuffer internals handle state.

export class MainRingBufferQueue {
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

  async enqueue(item: Uint8Array, timeoutMs: number): Promise<boolean> {
    const dataBytes = item
    const messageLength = dataBytes.length

    if (
      messageLength + MainRingBufferQueue.LENGTH_PREFIX_BYTES >
      this.ringBuffer.availableSpace
    ) {
      console.warn(
        `Message data (${messageLength} bytes) + prefix (${MainRingBufferQueue.LENGTH_PREFIX_BYTES} bytes) exceeds RingBuffer data capacity (${this.ringBuffer.availableSpace} bytes). Skipping item.`
      )
      return false
    }

    this.lengthPrefixDataView.setUint32(0, messageLength, true) // true for littleEndian

    const pushedLength = await this.ringBuffer.push(this.lengthPrefixArray, timeoutMs)
    if (!pushedLength) {
      console.error('Failed to push length prefix to the ring buffer.')
      return false
    }

    const pushedData = await this.ringBuffer.push(dataBytes, timeoutMs)
    if (!pushedData) {
      console.error('Failed to push length prefix to the ring buffer.')
      return false
    }
    return true
  }

  async dequeue(maxItems: number, timeoutMs: number): Promise<Uint8Array[]> {
    const dequeuedByteArrays: Uint8Array[] = []

    const start = Date.now()
    for (let itemsRead = 0; itemsRead < maxItems; itemsRead++) {
      const remainingTimeout = timeoutMs - (Date.now() - start)
      if (remainingTimeout <= 0) {
        if (itemsRead === 0 && maxItems > 0) {
          // Only log timeout if we were expecting to read something and read nothing.
          // console.warn(`Dequeue operation timed out after ${timeoutMs}ms`)
        }
        break
      }

      // 1. Peek for the length prefix to see if a message is waiting.
      const lengthBytes = await this.ringBuffer.peek(
        MainRingBufferQueue.LENGTH_PREFIX_BYTES,
        remainingTimeout
      )

      if (!lengthBytes) {
        // Timed out waiting for a message length to appear. This is normal if the queue is empty.
        break
      }

      this.lengthPrefixArray.set(lengthBytes)
      const messageLength = this.lengthPrefixDataView.getUint32(0, true)
      const totalMessageBytes = MainRingBufferQueue.LENGTH_PREFIX_BYTES + messageLength

      // 2. Check if the *entire* message (prefix + data) is available to be read.
      if (this.ringBuffer.length < totalMessageBytes) {
        // Not enough data for the full message yet. Wait for it to arrive.
        const dataAppeared = await this.ringBuffer.waitForData(
          totalMessageBytes,
          remainingTimeout
        )
        if (!dataAppeared) {
          // Timed out waiting for the full message data to appear.
          console.warn('Dequeue: Timed out waiting for full message data.')
          break
        }
      }

      // 3. At this point, the full message should be in the buffer. Now we can safely shift it.

      // Shift the length prefix (which we already have from peek).
      // Timeout is 0 because we know the data is there.
      await this.ringBuffer.shift(MainRingBufferQueue.LENGTH_PREFIX_BYTES, 0)

      if (messageLength === 0) {
        dequeuedByteArrays.push(new Uint8Array(0))
        continue
      }

      if (messageLength > this.ringBuffer.totalSpace) {
        console.error(
          `Dequeue: Declared message length (${messageLength} bytes) exceeds RingBuffer total space (${this.ringBuffer.totalSpace}). Possible data corruption.`
        )
        break
      }

      const dataBytes = await this.ringBuffer.shift(messageLength, 0) // Timeout 0
      if (!dataBytes || dataBytes.length < messageLength) {
        console.warn(
          `Dequeue: Received incomplete message data (got ${
            dataBytes?.length || 0
          }, expected ${messageLength} bytes). Buffer likely corrupted.`
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
    return dequeuedByteArrays
  }
}
