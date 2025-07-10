// RingBuffer.ts
import { RingBuffer } from './RingBuffer.js'
import { RingBufferState } from './RingBufferState.js'

export interface Uint8ArrayConstructor {
  new (length: number): Uint8Array
  new (
    buffer: SharedArrayBuffer | ArrayBuffer,
    byteOffset?: number,
    length?: number
  ): Uint8Array
  readonly BYTES_PER_ELEMENT: number
}
type TypedArray = Uint8Array // Internal type, not exported

export class WorkerRingBuffer {
  private buffer: TypedArray
  private controlBuffer: Int32Array // [writeIdx, readIdx, state]

  public capacity: number // Number of elements (not bytes, unless elementSize is 1)
  private elementSize: number
  private typeConstructor: Uint8ArrayConstructor
  private internalSharedBuffer: SharedArrayBuffer

  constructor(
    sharedBuffer: SharedArrayBuffer,
    typeConstructor: Uint8ArrayConstructor,
    capacityElements: number, // This is capacity in terms of number of elements of typeConstructor
    isNewBuffer: boolean = false
  ) {
    if (typeof SharedArrayBuffer === 'undefined' || typeof Atomics === 'undefined') {
      throw new Error(
        'SharedArrayBuffer and Atomics are not supported in this environment.'
      )
    }

    this.internalSharedBuffer = sharedBuffer
    this.typeConstructor = typeConstructor
    this.elementSize = this.typeConstructor.BYTES_PER_ELEMENT // Should always be 1 for Uint8Array
    this.capacity = capacityElements

    const dataBufferByteLength = capacityElements * this.elementSize
    const dataBufferByteOffset = RingBuffer.CONTROL_BUFFER_BYTE_LENGTH
    const requiredTotalBufferSize = dataBufferByteOffset + dataBufferByteLength

    if (sharedBuffer.byteLength < requiredTotalBufferSize) {
      throw new Error(
        `Provided SharedArrayBuffer is too small. Expected at least ${requiredTotalBufferSize} bytes for ${capacityElements} elements, ` +
          `but got ${sharedBuffer.byteLength} bytes.`
      )
    }

    this.controlBuffer = new Int32Array(
      sharedBuffer,
      0,
      RingBuffer.CONTROL_BUFFER_SIZE_ELEMENTS
    )
    // The buffer view should be for 'capacityElements' number of elements
    this.buffer = new this.typeConstructor(
      sharedBuffer,
      dataBufferByteOffset,
      capacityElements
    )

    if (isNewBuffer) {
      Atomics.store(this.controlBuffer, RingBuffer.WRITE_IDX_POS, 0)
      Atomics.store(this.controlBuffer, RingBuffer.READ_IDX_POS, 0)
      Atomics.store(this.controlBuffer, RingBuffer.STATE_POS, RingBufferState.EMPTY)
    }
  }

  // Capacity here is in BYTES for Uint8Array specifically, matching RingBufferQueue's expectation
  static create(capacityBytes: number): WorkerRingBuffer {
    const elementSize = Uint8Array.BYTES_PER_ELEMENT // This is 1
    // For Uint8Array, capacityBytes is the same as capacityElements
    const capacityElements = capacityBytes
    const totalByteLength =
      RingBuffer.CONTROL_BUFFER_BYTE_LENGTH + capacityElements * elementSize
    const sharedBuffer = new SharedArrayBuffer(totalByteLength)
    return new WorkerRingBuffer(sharedBuffer, Uint8Array, capacityElements, true)
  }

  // Capacity here is in BYTES for Uint8Array
  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number
  ): WorkerRingBuffer {
    // For Uint8Array, capacityBytes is the same as capacityElements
    return new WorkerRingBuffer(sharedBuffer, Uint8Array, capacityBytes, false)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.internalSharedBuffer
  }

  get length(): number {
    // Number of elements currently in the buffer
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    if (writeIdx >= readIdx) {
      return writeIdx - readIdx
    }
    return this.capacity - (readIdx - writeIdx)
  }

  // Returns available space in number of elements
  get availableSpace(): number {
    // The buffer is full if the write pointer is one position behind the read pointer (circularly).
    // So, available space is capacity - length - 1 (for the marker).
    return this.capacity - this.length - 1
  }

  isFull(): boolean {
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    return (writeIdx + 1) % this.capacity === readIdx
  }

  isEmpty(): boolean {
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    return writeIdx === readIdx
  }

  // data is Uint8Array, so data.length is number of bytes (elements)
  push(data: Uint8Array, timeoutMs: number = Infinity): boolean {
    const dataLengthElements = data.length // For Uint8Array, length is number of elements
    if (dataLengthElements === 0) return true
    if (dataLengthElements > this.capacity) {
      // Check against element capacity
      console.error(
        `Data to push (${dataLengthElements} elements) exceeds buffer capacity (${this.capacity} elements).`
      )
      Atomics.store(this.controlBuffer, RingBuffer.STATE_POS, RingBufferState.OVERFLOW)
      return false
    }

    while (true) {

      const currentWriteIndex = Atomics.load(
        this.controlBuffer,
        RingBuffer.WRITE_IDX_POS
      )
      const currentReadIndex = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)


      // Calculate actual contiguous and total available space more directly
      let availableSlots
      if (currentWriteIndex >= currentReadIndex) {
        availableSlots = this.capacity - (currentWriteIndex - currentReadIndex) - 1
      } else {
        // read index is ahead of write index
        availableSlots = currentReadIndex - currentWriteIndex - 1
      }

      if (dataLengthElements <= availableSlots) {
        let tempWriteIndex = currentWriteIndex
        // Copy data, handling wrap-around
        for (let i = 0; i < dataLengthElements; i++) {
          this.buffer[tempWriteIndex] = data[i]
          tempWriteIndex = (tempWriteIndex + 1) % this.capacity
        }

        Atomics.store(this.controlBuffer, RingBuffer.WRITE_IDX_POS, tempWriteIndex)
        Atomics.store(
          this.controlBuffer,
          RingBuffer.STATE_POS,
          this.isFull() ? RingBufferState.FULL : RingBufferState.READY
        )
        Atomics.notify(this.controlBuffer, RingBuffer.READ_IDX_POS) // Notify readers waiting on read index
        return true
      } else {
        Atomics.store(this.controlBuffer, RingBuffer.STATE_POS, RingBufferState.FULL)

        // Wait for space: writer waits if its current writeIndex is problematic
        // It's better to wait on the readIndex, as space becomes available when readIdx changes.
        // Or, more simply, wait on a general notification if any control index changes.
        // However, Atomics.wait needs a specific index and value to check.
        // Writers are blocked by readIdx not moving. Readers are blocked by writeIdx not moving.
        // A writer is interested when read_idx changes making space.
        // A reader is interested when write_idx changes making data.
        // So, writer should wait on read_idx. But we can't predict what read_idx will become.
        // Let's make writer wait on its own write_idx, hoping a reader will notify it on 0 (write_idx_pos).
        const outcome = Atomics.wait(
          this.controlBuffer,
          RingBuffer.WRITE_IDX_POS,
          currentWriteIndex,
          timeoutMs
        )

        if (outcome !== 'ok') {
          return false
        }
        // if 'ok' or 'not-equal', loop again to re-check space
      }
    }
  }

  // numElements is number of Uint8Array elements (bytes)
  shift(numElements: number, timeoutMs: number = Infinity): Uint8Array | null {
    if (numElements === 0) return new this.typeConstructor(0)
    if (numElements > this.capacity) {
      console.error(
        `Requested ${numElements} elements, but capacity is ${this.capacity}.`
      )
      return null
    }


    while (true) {

      const currentWriteIndex = Atomics.load(
        this.controlBuffer,
        RingBuffer.WRITE_IDX_POS
      )
      const currentReadIndex = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)

      let availableDataElements: number
      if (currentWriteIndex >= currentReadIndex) {
        availableDataElements = currentWriteIndex - currentReadIndex
      } else {
        // Write index has wrapped around
        availableDataElements = this.capacity - (currentReadIndex - currentWriteIndex)
      }

      if (availableDataElements >= numElements) {
        const resultBuffer = new this.typeConstructor(numElements)
        let tempReadIndex = currentReadIndex

        // Copy data, handling wrap-around
        for (let i = 0; i < numElements; i++) {
          resultBuffer[i] = this.buffer[tempReadIndex]
          tempReadIndex = (tempReadIndex + 1) % this.capacity
        }

        Atomics.store(this.controlBuffer, RingBuffer.READ_IDX_POS, tempReadIndex)
        Atomics.store(
          this.controlBuffer,
          RingBuffer.STATE_POS,
          this.isEmpty() ? RingBufferState.EMPTY : RingBufferState.READY
        )
        Atomics.notify(this.controlBuffer, RingBuffer.WRITE_IDX_POS) // Notify writers waiting on write index
        return resultBuffer
      } else {
        Atomics.store(this.controlBuffer, RingBuffer.STATE_POS, RingBufferState.EMPTY)

        // Wait for data: reader waits if currentReadIndex makes buffer seem empty relative to writeIndex
        // Reader waits on write_idx changing.
        const outcome = Atomics.wait(
          this.controlBuffer,
          RingBuffer.READ_IDX_POS,
          currentReadIndex,
          timeoutMs
        )

        if (outcome !== 'ok') {
          return null
        }
        // if 'ok' or 'not-equal', loop again
      }
    }
  }

  // These synchronous wait methods are generally discouraged in main thread or async contexts
  // but can be useful in specific worker scenarios if blocking is acceptable.
  // Consider if these are truly needed or if async push/shift cover all uses.
 /* waitForData(timeoutMs: number = Infinity): boolean {
    const currentReadIndex = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    const result = Atomics.wait(
      this.controlBuffer,
      RingBuffer.READ_IDX_POS,
      currentReadIndex,
      timeoutMs
    )
    return result === 'ok' || result === 'not-equal' // 'not-equal' means value changed before timeout
  }

  waitForSpace(timeoutMs: number = Infinity): boolean {
    const currentWriteIndex = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const result = Atomics.wait(
      this.controlBuffer,
      RingBuffer.WRITE_IDX_POS,
      currentWriteIndex,
      timeoutMs
    )
    return result === 'ok' || result === 'not-equal'
  }*/
}
