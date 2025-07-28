import { describe, it, expect } from 'vitest'
import { RingBuffer } from './RingBuffer.js'

describe('RingBuffer', () => {
  const capacityBytes = 10 // Example capacity

  it('should detect when the buffer is empty', () => {
    const ringBuffer = RingBuffer.create(capacityBytes)

    expect(ringBuffer.isEmpty()).toBe(true)
    expect(ringBuffer.isFull()).toBe(false)
  })

  it('should detect when the buffer is full', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes) // Fill the buffer to capacity

    const pushResult = await ringBuffer.push(data, 500)
    expect(pushResult).toBeTruthy()
    expect(ringBuffer.isFull()).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)
  })

  it('should not allow pushing data when the buffer is full', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    expect(ringBuffer.isFull()).toBe(false)
    expect(ringBuffer.isEmpty()).toBe(true)
    expect(ringBuffer.availableSpaces).toBe(capacityBytes)
    expect(ringBuffer.capacity).toBe(capacityBytes)
    const data = new Uint8Array(capacityBytes) // Fill the buffer to capacity

    expect(await ringBuffer.push(data, 500)).toBeTruthy()
    const extraData = new Uint8Array(1) // Try to push one more element
    const pushResult = await ringBuffer.push(extraData, 500)

    expect(pushResult).toBe(false)
    expect(ringBuffer.isFull()).toBe(true)
  })

  it('should allow pushing and shifting data correctly', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])

    const pushResult = await ringBuffer.push(data, 500)
    expect(pushResult).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)

    const shiftedData = await ringBuffer.shift(data.length, 500)
    expect(shiftedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(true)
  })

  it('should allow peeking data without removing it', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])

    await ringBuffer.push(data, 500)

    const peekedData = await ringBuffer.peek(data.length, 500)
    expect(peekedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(false) // Still contains the data

    // Shift the data to confirm it was still there
    const shiftedData = await ringBuffer.shift(data.length, 500)
    expect(shiftedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(true)
  })

  it('should return null when peeking from an empty buffer and timeout occurs', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const peekedData = await ringBuffer.peek(1, 100) // Short timeout
    expect(peekedData).toBeNull()
  })

  it('should return null when peeking more data than available and timeout occurs', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])
    await ringBuffer.push(data, 500)

    const peekedData = await ringBuffer.peek(data.length + 1, 100) // Request more than available
    expect(peekedData).toBeNull()
  })

  it('should successfully peek data that is pushed after the peek call started', async () => {
    const ringBuffer = RingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])

    const peekPromise = ringBuffer.peek(data.length, 500)

    // Push data after a short delay, while peek is waiting
    await new Promise((res) => setTimeout(res, 50))
    await ringBuffer.push(data, 500)

    const peekedData = await peekPromise
    expect(peekedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(false)
  })
})
