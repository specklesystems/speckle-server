import { describe, test, expect } from 'vitest'
import { StringQueue } from './StringQueue.js'
import { RingBufferQueue } from '../workers/RingBufferQueue.js'

describe('StringQueue', () => {
  test('should enqueue and dequeue strings successfully', async () => {
    const rbq = RingBufferQueue.create(1000, 'test1')
    const queue = new StringQueue(rbq)

    const messagesToEnqueue = ['hello', 'world']

    const enqueueResult = await queue.enqueue(messagesToEnqueue, 500)
    expect(enqueueResult).toBe(2)

    const dequeuedMessages = await queue.dequeue(2, 500)
    expect(dequeuedMessages).toEqual(messagesToEnqueue)
  })

  test('should handle empty enqueue gracefully', async () => {
    const rbq = RingBufferQueue.create(100, 'test2')
    const queue = new StringQueue(rbq)

    const enqueueResult = await queue.enqueue([], 500)
    expect(enqueueResult).toBe(0)
  })

  test('should handle empty dequeue gracefully', async () => {
    const rbq = RingBufferQueue.create(100, 'test3')
    const queue = new StringQueue(rbq)

    const dequeuedMessages = await queue.dequeue(5, 500)
    expect(dequeuedMessages).toEqual([])
  })

  test('should not enqueue strings when underlying queue is full', async () => {
    // Capacity needs to account for item header (4 bytes)
    const smallCapacity = new TextEncoder().encode('small').length + 4
    const rbq = RingBufferQueue.create(smallCapacity, 'test4')
    const queue = new StringQueue(rbq)

    // This should fill the queue
    let enqueueResult = await queue.enqueue(['small'], 500)
    expect(enqueueResult).toBe(1)

    // This should fail
    enqueueResult = await queue.enqueue(['overflow'], 500)
    expect(enqueueResult).toBe(0)
  })

  test('should not dequeue strings when underlying queue is empty', async () => {
    const rbq = RingBufferQueue.create(100, 'test5')
    const queue = new StringQueue(rbq)

    const dequeuedMessages = await queue.dequeue(1, 500)
    expect(dequeuedMessages).toEqual([])
  })
})
