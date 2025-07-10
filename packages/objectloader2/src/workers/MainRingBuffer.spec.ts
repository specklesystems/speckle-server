import { describe, it, expect } from 'vitest'
import { MainRingBuffer } from './MainRingBuffer.js'

describe('MainRingBuffer', () => {
  const capacityBytes = 10 // Example capacity

  it('should detect when the buffer is empty', () => {
    const ringBuffer = MainRingBuffer.create(capacityBytes)

    expect(ringBuffer.isEmpty()).toBe(true)
    expect(ringBuffer.isFull()).toBe(false)
  })

  it('should detect when the buffer is full', async () => {
    const ringBuffer = MainRingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes - 1) // Fill the buffer to capacity - 1

    const pushResult = await ringBuffer.push(data, 500)
    expect(pushResult).toBeTruthy()
    expect(ringBuffer.isFull()).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)
  })

  it('should not allow pushing data when the buffer is full', async () => {
    const ringBuffer = MainRingBuffer.create(capacityBytes)
    const data = new Uint8Array(capacityBytes - 1) // Fill the buffer to capacity - 1

    expect(await ringBuffer.push(data, 500)).toBeTruthy()
    const extraData = new Uint8Array(1) // Try to push one more element
    const pushResult = await ringBuffer.push(extraData, 500)

    expect(pushResult).toBe(false)
    expect(ringBuffer.isFull()).toBe(true)
  })

  it('should allow pushing and shifting data correctly', async () => {
    const ringBuffer = MainRingBuffer.create(capacityBytes)
    const data = new Uint8Array([1, 2, 3])

    const pushResult = await ringBuffer.push(data, 500)
    expect(pushResult).toBe(true)
    expect(ringBuffer.isEmpty()).toBe(false)

    const shiftedData = await ringBuffer.shift(data.length, 500)
    expect(shiftedData).toEqual(data)
    expect(ringBuffer.isEmpty()).toBe(true)
  })
})
