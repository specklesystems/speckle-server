import { throwIfCantUseWorkers } from '../types/functions.js'
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

export class RingBuffer {
  private buffer: TypedArray
  private controlBuffer: Int32Array // [writeIdx, readIdx, state]
  private static readonly WRITE_IDX_POS = 0
  private static readonly READ_IDX_POS = 1
  private static readonly STATE_POS = 2

  private static readonly CONTROL_BUFFER_SIZE_ELEMENTS = 3
  private static readonly CONTROL_BUFFER_BYTE_LENGTH =
    RingBuffer.CONTROL_BUFFER_SIZE_ELEMENTS * Int32Array.BYTES_PER_ELEMENT

  private capacityPlusOne: number // Number of elements (not bytes, unless elementSize is 1)
  private elementSize: number
  private typeConstructor: Uint8ArrayConstructor
  private internalSharedBuffer: SharedArrayBuffer

  constructor(
    sharedBuffer: SharedArrayBuffer,
    typeConstructor: Uint8ArrayConstructor,
    capacityElements: number, // This is capacity in terms of number of elements of typeConstructor
    isNewBuffer: boolean = false
  ) {
    throwIfCantUseWorkers()
    this.internalSharedBuffer = sharedBuffer
    this.typeConstructor = typeConstructor
    this.elementSize = this.typeConstructor.BYTES_PER_ELEMENT // Should always be 1 for Uint8Array
    this.capacityPlusOne = capacityElements

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
  static create(capacityBytes: number): RingBuffer {
    const elementSize = Uint8Array.BYTES_PER_ELEMENT // This is 1
    // For Uint8Array, capacityBytes is the same as capacityElements
    const capacityElements = capacityBytes + 1
    const totalByteLength =
      RingBuffer.CONTROL_BUFFER_BYTE_LENGTH + capacityElements * elementSize
    const sharedBuffer = new SharedArrayBuffer(totalByteLength)
    return new RingBuffer(sharedBuffer, Uint8Array, capacityElements, true)
  }

  // Capacity here is in BYTES for Uint8Array
  static fromExisting(
    sharedBuffer: SharedArrayBuffer,
    capacityBytes: number
  ): RingBuffer {
    // For Uint8Array, capacityBytes is the same as capacityElements
    return new RingBuffer(sharedBuffer, Uint8Array, capacityBytes + 1, false)
  }

  public getSharedArrayBuffer(): SharedArrayBuffer {
    return this.internalSharedBuffer
  }

  get capacity(): number {
    // Returns capacity in number of elements
    return this.capacityPlusOne - 1 // -1 because we keep one slot empty to distinguish full/empty states
  }

  get length(): number {
    // Number of elements currently in the buffer
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    if (writeIdx >= readIdx) {
      return writeIdx - readIdx
    }
    return this.capacityPlusOne - (readIdx - writeIdx)
  }

  isFull(): boolean {
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    return (writeIdx + 1) % this.capacityPlusOne === readIdx
  }

  isEmpty(): boolean {
    const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
    const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
    return writeIdx === readIdx
  }

  get availableSpaces(): number {
    return this.capacity - this.length
  }

  // data is Uint8Array, so data.length is number of bytes (elements)
  async push(data: Uint8Array, timeoutMs: number): Promise<boolean> {
    const dataLengthElements = data.length // For Uint8Array, length is number of elements
    if (dataLengthElements === 0) return true
    const capacity = this.capacity
    if (dataLengthElements > capacity) {
      // Check against element capacity
      console.error(
        `Data to push (${dataLengthElements} elements) exceeds buffer capacity (${this.capacity} elements).`
      )
      Atomics.store(this.controlBuffer, RingBuffer.STATE_POS, RingBufferState.OVERFLOW)
      return false
    }

    while (true) {
      const writeIdx = Atomics.load(this.controlBuffer, RingBuffer.WRITE_IDX_POS)
      const availableSpaces = this.availableSpaces

      if (dataLengthElements <= availableSpaces) {
        let tempWriteIndex = writeIdx
        // Copy data, handling wrap-around
        for (let i = 0; i < dataLengthElements; i++) {
          this.buffer[tempWriteIndex] = data[i]
          tempWriteIndex = (tempWriteIndex + 1) % this.capacityPlusOne
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
        const outcome = Atomics.waitAsync(
          this.controlBuffer,
          RingBuffer.WRITE_IDX_POS,
          writeIdx,
          timeoutMs
        )
        let val
        if (outcome.async) {
          val = await outcome.value // Wait for the async operation to complete
        } else {
          val = outcome.value // Directly use the value if not async
        }

        if (val === 'timed-out') {
          return false
        }
        // if 'ok' or 'not-equal', loop again to re-check space
      }
    }
  }

  async peek(numElements: number, timeoutMs: number): Promise<Uint8Array | null> {
    if (numElements === 0) return new this.typeConstructor(0)
    if (numElements > this.capacity) {
      console.error(
        `Requested ${numElements} elements, but capacity is ${this.capacity}.`
      )
      return null
    }

    while (true) {
      const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)
      if (this.length >= numElements) {
        const resultBuffer = new this.typeConstructor(numElements)
        let tempReadIndex = readIdx

        for (let i = 0; i < numElements; i++) {
          resultBuffer[i] = this.buffer[tempReadIndex]
          tempReadIndex = (tempReadIndex + 1) % this.capacityPlusOne
        }
        // Unlike shift, we DO NOT advance the read pointer here.
        return resultBuffer
      } else {
        // Wait for enough data to be available.
        // We wait on the read index, because we are a reader. A writer will notify us.
        // But the value we are waiting on is the write index to change.
        // Let's wait on the read index, and the writer will notify on the read index pos.
        const outcome = Atomics.waitAsync(
          this.controlBuffer,
          RingBuffer.READ_IDX_POS,
          readIdx, // wait if read_idx is still the same
          timeoutMs
        )
        const res = outcome.async ? await outcome.value : outcome.value
        if (res === 'timed-out') {
          return null
        }
      }
    }
  }

  async waitForData(requiredLength: number, timeoutMs: number): Promise<boolean> {
    const start = Date.now()
    while (true) {
      if (this.length >= requiredLength) {
        return true
      }
      const remainingTimeout = timeoutMs - (Date.now() - start)
      if (remainingTimeout <= 0) {
        return false
      }
      // Wait for a writer to make a change. A writer notifies on READ_IDX_POS after it writes.
      const outcome = Atomics.waitAsync(
        this.controlBuffer,
        RingBuffer.READ_IDX_POS,
        Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS),
        remainingTimeout
      )
      const res = outcome.async ? await outcome.value : outcome.value
      if (res === 'timed-out') {
        return false
      }
    }
  }

  // numElements is number of Uint8Array elements (bytes)
  async shift(numElements: number, timeoutMs: number): Promise<Uint8Array | null> {
    if (numElements === 0) return new this.typeConstructor(0)
    if (numElements > this.capacity) {
      console.error(
        `Requested ${numElements} elements, but capacity is ${this.capacity}.`
      )
      return null
    }

    while (true) {
      const readIdx = Atomics.load(this.controlBuffer, RingBuffer.READ_IDX_POS)

      if (this.length >= numElements) {
        const resultBuffer = new this.typeConstructor(numElements)
        let tempReadIndex = readIdx

        // Copy data, handling wrap-around
        for (let i = 0; i < numElements; i++) {
          resultBuffer[i] = this.buffer[tempReadIndex]
          tempReadIndex = (tempReadIndex + 1) % this.capacityPlusOne
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
        const outcome = Atomics.waitAsync(
          this.controlBuffer,
          RingBuffer.READ_IDX_POS,
          readIdx,
          timeoutMs
        )

        let val
        if (outcome.async) {
          val = await outcome.value // Wait for the async operation to complete
        } else {
          val = outcome.value // Directly use the value if not async
        }
        if (val === 'timed-out') {
          return null
        }
        // if 'ok' or 'not-equal', loop again
      }
    }
  }
}
