import { describe, it, expect } from 'vitest'
import { RingBufferQueue } from './RingBufferQueue.js'

const CAPACITY_BYTES = 1024
const QUEUE_NAME = 'TestQueue'

describe('RingBufferQueue', () => {
  it('should enqueue and dequeue items successfully', async () => {
    const queue = RingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const itemsToEnqueue = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6, 7])]

    let enqueueResult = await queue.enqueue(itemsToEnqueue[0], 500)
    expect(enqueueResult).toBe(true)
    enqueueResult = await queue.enqueue(itemsToEnqueue[1], 500)
    expect(enqueueResult).toBe(true)

    let dequeuedItem = await queue.dequeue(500)
    expect(dequeuedItem).toEqual(itemsToEnqueue[0])
    dequeuedItem = await queue.dequeue(500)
    expect(dequeuedItem).toEqual(itemsToEnqueue[1])
  })

  it('should handle empty dequeue gracefully', async () => {
    const queue = RingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const dequeuedItems = await queue.dequeue(500)
    expect(dequeuedItems).toBeUndefined()
  })

  it('should not enqueue items when full', async () => {
    const queue = RingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    // Fill the queue with maximum capacity
    const largeItem = new Uint8Array(CAPACITY_BYTES - 5) // Account for length prefix
    const enqueueResult = await queue.enqueue(largeItem, 500)
    expect(enqueueResult).toBe(true)

    // Attempt to enqueue another item
    const enqueueOverflowResult = await queue.enqueue(new Uint8Array([1, 2, 3]), 500)
    expect(enqueueOverflowResult).toBe(false)
  })

  it('should not dequeue items when empty', async () => {
    const queue = RingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const dequeuedItems = await queue.dequeue(500)
    expect(dequeuedItems).toBeUndefined()
  })
})
