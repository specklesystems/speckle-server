import { describe, it, expect } from 'vitest'
import { WorkerRingBufferQueue } from './WorkerRingBufferQueue.js'

const CAPACITY_BYTES = 1024
const QUEUE_NAME = 'TestQueue'

describe('WorkerRingBufferQueue', () => {
  it('should enqueue and dequeue items successfully', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const itemsToEnqueue = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6, 7])]

    const enqueueResult = await queue.enqueue(itemsToEnqueue, 500)
    expect(enqueueResult).toBe(true)

    const dequeuedItems = await queue.dequeue(2, 500)
    expect(dequeuedItems).toHaveLength(2)
    expect(dequeuedItems[0]).toEqual(itemsToEnqueue[0])
    expect(dequeuedItems[1]).toEqual(itemsToEnqueue[1])
  })

  it('should handle empty enqueue gracefully', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const enqueueResult = await queue.enqueue([], 500)
    expect(enqueueResult).toBe(true)
  })

  it('should handle empty dequeue gracefully', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const dequeuedItems = await queue.dequeue(5, 500)
    expect(dequeuedItems).toHaveLength(0)
  })

  it('should not enqueue items when full', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    // Fill the queue with maximum capacity
    const largeItem = new Uint8Array(CAPACITY_BYTES - 5) // Account for length prefix
    const enqueueResult = await queue.enqueue([largeItem], 500)
    expect(enqueueResult).toBe(true)

    // Attempt to enqueue another item
    const enqueueOverflowResult = await queue.enqueue([new Uint8Array([1, 2, 3])], 500)
    expect(enqueueOverflowResult).toBe(false)
  })

  it('should not dequeue items when empty', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)

    const dequeuedItems = await queue.dequeue(1, 500)
    expect(dequeuedItems).toHaveLength(0)
  })

  it('should not enqueue items when full and more', async () => {
    const queue = WorkerRingBufferQueue.create(CAPACITY_BYTES, QUEUE_NAME)
    expect(queue.isEmpty()).toBe(true)

    // Fill the queue with maximum capacity
    const largeItem = new Uint8Array(CAPACITY_BYTES - 5) // Account for length prefix
    const enqueueResult = await queue.enqueue([largeItem], 500)
    expect(enqueueResult).toBe(true)
    expect(queue.isFull()).toBe(true)
    expect(queue.isEmpty()).toBe(false)

    // Attempt to enqueue another item
    const enqueueOverflowResult = await queue.enqueue([new Uint8Array([1, 2, 3])], 500)
    expect(enqueueOverflowResult).toBe(false)
    expect(queue.isFull()).toBe(true)
    expect(queue.isEmpty()).toBe(false)

    const dVal = await queue.dequeue(12, 500)
    expect(dVal.length).toBe(1)
    expect(dVal[0].length).toBe(largeItem.length)
    expect(queue.isFull()).toBe(false)
    expect(queue.isEmpty()).toBe(true)

    const regItem = await queue.enqueue([new Uint8Array([1, 2, 3])], 500)
    expect(regItem).toBe(true)
    expect(queue.isFull()).toBe(false)
    expect(queue.isEmpty()).toBe(false)
  })
})
