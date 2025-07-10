import { describe, it, expect } from 'vitest'
import { WorkerRingBuffer } from './WorkerRingBuffer.js'

describe('WorkerRingBuffer', () => {
  const capacityBytes = 10 // Example capacity

  it('should detect when the buffer is empty', () => {
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)

    expect(ringBuffer.isEmpty()).toBe(true)
    expect(ringBuffer.isFull()).toBe(false)
  })

  it('should detect when the buffer is full', () => {
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes - 1) // Fill the buffer to capacity - 1

    const pushResult = ringBuffer.push(data, 500)
    expect(pushResult).toBe(true)
    expect(ringBuffer.isFull()).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)
  })

  it('should detect when the buffer is full and ', () => {
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes - 1) // Fill the buffer to capacity - 1

    const pushResult = ringBuffer.push(data, 500)
    expect(pushResult).toBe(true)
    expect(ringBuffer.isFull()).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)

    const shiftResult = ringBuffer.shift(2, 500)
    expect(shiftResult).toBeDefined()
    expect(ringBuffer.isFull()).toBe(false)
    expect(ringBuffer.isEmpty()).toBe(false)

    const shiftResult2 = ringBuffer.shift(data.length - 2, 500)
    expect(shiftResult2).toBeDefined()
    expect(ringBuffer.isFull()).toBe(false)
    expect(ringBuffer.isEmpty()).toBe(true)

    const pushResult2 = ringBuffer.push(new Uint8Array(2), 500)
    expect(pushResult2).toBe(true)
    expect(ringBuffer.isFull()).toBe(false)
    expect(ringBuffer.isEmpty()).toBe(false)
  })

  it('should not allow pushing data when the buffer is full', () => {
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes - 1) // Fill the buffer to capacity - 1

    expect(ringBuffer.push(data, 500)).toBe(true)
    const extraData = new Uint8Array(1) // Try to push one more element
    const pushResult = ringBuffer.push(extraData, 500)

    expect(pushResult).toBe(false)
    expect(ringBuffer.isFull()).toBe(true)
  })

  it('should allow pushing and shifting data correctly', () => {
    const ringBuffer = WorkerRingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])

    const pushResult = ringBuffer.push(data, 500)
    expect(pushResult).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)

    const shiftedData = ringBuffer.shift(data.length, 500)
    expect(shiftedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(true)
  })
})
