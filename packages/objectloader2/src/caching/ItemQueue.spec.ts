import { describe, it, expect, beforeEach } from 'vitest'
import { ItemQueue } from './ItemQueue.js'
import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { Item } from '../types/types.js'

describe('ItemQueue', () => {
  let itemQueue: ItemQueue
  let rbq: RingBufferQueue

  beforeEach(() => {
    // A new queue for each test to ensure isolation
    // The size is arbitrary, but should be large enough for most tests.
    rbq = RingBufferQueue.create(2048, `item-queue-test-${Math.random()}`)
    itemQueue = new ItemQueue(rbq)
  })

  it('should enqueue and dequeue items successfully', async () => {
    const items: Item[] = [
      { baseId: '1', base: { id: 'base1', speckle_type: 'Base' } },
      { baseId: '2', base: { id: 'base2', speckle_type: 'Base' } }
    ]

    const enqueueResult = await itemQueue.enqueue(items, 1000)
    expect(enqueueResult).toBe(2)

    const dequeuedItems = await itemQueue.dequeue(2, 1000)
    expect(dequeuedItems).toEqual(items)
  })

  it('should not enqueue when queue is full', async () => {
    const item: Item = { baseId: '1', base: { id: 'base1', speckle_type: 'Base' } }
    const itemString = JSON.stringify(item)
    const itemByteLength = new TextEncoder().encode(itemString).length
    const smallRbq = RingBufferQueue.create(
      itemByteLength + 4,
      `small-queue-${Math.random()}`
    ) // +4 for header
    const smallItemQueue = new ItemQueue(smallRbq)

    // Enqueue one item to fill the queue
    let result = await smallItemQueue.enqueue([item], 1000)
    expect(result).toBe(1)

    // Try to enqueue another item, which should fail
    result = await smallItemQueue.enqueue([item], 1000)
    expect(result).toBe(0)
  })

  it('should return an empty array when dequeuing from an empty queue', async () => {
    const result = await itemQueue.dequeue(10, 1000)
    expect(result).toEqual([])
  })

  it('should handle multiple enqueues and dequeues', async () => {
    const items1: Item[] = [
      { baseId: '1', base: { id: 'base1', speckle_type: 'Base' } }
    ]
    const items2: Item[] = [
      { baseId: '2', base: { id: 'base2', speckle_type: 'Base' } }
    ]

    await itemQueue.enqueue(items1, 1000)
    await itemQueue.enqueue(items2, 1000)

    const dequeued1 = await itemQueue.dequeue(1, 1000)
    expect(dequeued1).toEqual(items1)

    const dequeued2 = await itemQueue.dequeue(1, 1000)
    expect(dequeued2).toEqual(items2)
  })

  it('should return the shared array buffer', () => {
    const sharedArrayBuffer = rbq.getSharedArrayBuffer()
    const result = itemQueue.getSharedArrayBuffer()
    expect(result).toBe(sharedArrayBuffer)
    expect(result).toBeInstanceOf(SharedArrayBuffer)
  })
})
