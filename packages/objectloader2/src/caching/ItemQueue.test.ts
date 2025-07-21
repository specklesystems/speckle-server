import { describe, it, expect, beforeEach } from 'vitest'
import { ItemQueue } from './ItemQueue.js'
import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { Base, Item } from '../types/types.js'
import { delay } from '../types/functions.js'

describe('ItemQueue (Integration)', () => {
  let sab: SharedArrayBuffer
  let producerQueue: ItemQueue
  let consumerQueue: ItemQueue

  const createDummyItems = (count: number): Item[] => {
    return Array.from({ length: count }, (_, i) => {
      const base: Base = {
        id: `id-${i}`,
        // eslint-disable-next-line camelcase
        speckle_type: 'Base'
      }
      return {
        baseId: `id-${i}`,
        base
      }
    })
  }

  describe('With ample buffer space', () => {
    beforeEach(() => {
      // 16KB buffer, should be plenty for these tests
      const capacity = 16 * 1024
      const rbq = RingBufferQueue.create(capacity, 'test-queue')
      sab = rbq.getSharedArrayBuffer() // Get the SAB from the created queue
      producerQueue = new ItemQueue(rbq)
      // Create a second queue instance for the consumer attached to the same buffer
      const consumerRbq = RingBufferQueue.fromExisting(sab, capacity, 'test-queue')
      consumerQueue = new ItemQueue(consumerRbq)
    })

    it('should do nothing if the initial message array is empty', async () => {
      await producerQueue.fullyEnqueue([], 10)
      const dequeued = await consumerQueue.dequeue(5, 10)
      expect(dequeued.length).toBe(0)
    })

    it('should enqueue and dequeue a small number of items', async () => {
      const items = createDummyItems(5)
      await producerQueue.fullyEnqueue(items, 100)

      const dequeuedItems = await consumerQueue.dequeue(5, 100)

      expect(dequeuedItems.length).toBe(5)
      expect(dequeuedItems).toEqual(items)
    })
  })

  describe('With limited buffer space', () => {
    it('should wait and retry if the buffer is full, then proceed when space is available', async () => {
      // Create a small buffer that can only fit ~2-3 items.
      // An item is ~100 bytes, so 512 bytes is a good small size.
      const capacity = 512
      const rbq = RingBufferQueue.create(capacity, 'test-queue-limited')
      sab = rbq.getSharedArrayBuffer()
      producerQueue = new ItemQueue(rbq)
      const consumerRbq = RingBufferQueue.fromExisting(
        sab,
        capacity,
        'test-queue-limited'
      )
      consumerQueue = new ItemQueue(consumerRbq)

      const itemsToEnqueue = createDummyItems(10) // More items than fit in the buffer

      let dequeuedItems: Item[] = []
      const dequeuePromise = (async (): Promise<void> => {
        // Wait a moment to ensure enqueue starts first and fills the buffer
        await delay(50)
        while (dequeuedItems.length < itemsToEnqueue.length) {
          const batch = await consumerQueue.dequeue(1, 50)
          if (batch.length > 0) {
            dequeuedItems = dequeuedItems.concat(batch)
          } else {
            // if no items, wait a bit before trying again
            await delay(10)
          }
        }
      })()

      // This call should block until the dequeuePromise makes space
      await producerQueue.fullyEnqueue(itemsToEnqueue, 200)

      // Wait for the consumer to finish its work
      await dequeuePromise

      expect(dequeuedItems.length).toBe(itemsToEnqueue.length)
      expect(dequeuedItems).toEqual(itemsToEnqueue)
    }, 2000) // Increase timeout for this test
  })
})
