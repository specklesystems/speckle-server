import { describe, it, expect } from 'vitest'
import { MainRingBufferQueue } from './MainRingBufferQueue.js'
import { StringQueue } from './StringQueue.js'

describe('StringQueue with concurrent access', () => {
  it('should handle simultaneous reads and writes without data corruption', async () => {
    const queueCapacity = 100 // 1KB capacity
    const totalItems = 200 // Number of items to send
    const rbq = MainRingBufferQueue.create(queueCapacity, 'concurrent-test-queue')
    const queue = new StringQueue(rbq)

    // Create a set of messages with varying sizes
    const sourceItems = Array.from({ length: totalItems }, (_, i) => {
      const size = Math.floor(Math.random() * 150) + 1 // 1 to 151 bytes
      let item = `item-${i}-`
      item += 'a'.repeat(Math.max(0, size - item.length))
      return item
    })

    let writerError: unknown = null
    const writerPromise = (async (): Promise<void> => {
      try {
        for (let i = 0; i < sourceItems.length; i++) {
          const count = await queue.enqueue([sourceItems[i]], 2000)
          // Small random delay to make the timing less predictable
          await new Promise((res) => setTimeout(res, Math.random() * 5))
          if (count !== 1) {
            console.log(`Writer failed to enqueue item ${i}`)
            i--
            continue
          }

          if (i % 10 === 0) {
            console.log(`Enqueued 10 items from queue.`)
          }
        }
      } catch (e) {
        writerError = e
      }
    })()

    const receivedItems: string[] = []
    let readerError: unknown = null
    const readerPromise = (async (): Promise<void> => {
      try {
        while (receivedItems.length < totalItems) {
          const items = await queue.dequeue(10, 2000) // Try to dequeue up to 10 items at a time
          if (items.length > 0) {
            receivedItems.push(...items)
          } else {
            // If the queue is empty, wait a moment before trying again
            await new Promise((res) => setTimeout(res, 10))
          }
        }
      } catch (e) {
        readerError = e
      }
    })()

    // Wait for both the writer and reader to complete
    await Promise.all([writerPromise, readerPromise])

    // Assert that no errors occurred during the process
    expect(writerError).toBeNull()
    expect(readerError).toBeNull()

    // Assert that all items were received correctly
    expect(receivedItems.length).toBe(totalItems)

    // Assert that the received items match the source items in order and content
    for (let i = 0; i < totalItems; i++) {
      expect(receivedItems[i]).toEqual(sourceItems[i])
    }
  }, 50000) // Increase timeout for this test as it involves delays

  it('should handle simultaneous reads and writes without data corruption 2', async () => {
    const queueCapacity = 1_000 // 1KB capacity
    const totalItems = 2000 // Number of items to send
    const rbq = MainRingBufferQueue.create(queueCapacity, 'concurrent-test-queue-2')
    const queue = new StringQueue(rbq)

    // Create a set of messages with varying sizes
    const sourceItems = Array.from({ length: totalItems }, (_, i) => {
      const size = Math.floor(Math.random() * 150) + 1 // 1 to 151 bytes
      let item = `item-${i}-`
      item += 'a'.repeat(Math.max(0, size - item.length))
      return item
    })

    let writerError: unknown = null
    const writerPromise = (async (): Promise<void> => {
      try {
        for (let i = 0; i < sourceItems.length; i++) {
          const count = await queue.enqueue([sourceItems[i]], 2000)
          if (count < 1) {
            console.log(`Writer failed to enqueue item ${i}`)
            i--
            continue
          }

          if (i % 10 === 0) {
            console.log(`Enqueued 10 items from queue.`)
          }
        }
      } catch (e) {
        writerError = e
      }
    })()

    const receivedItems: string[] = []
    let readerError: unknown = null
    const readerPromise = (async (): Promise<void> => {
      try {
        while (receivedItems.length < totalItems) {
          const items = await queue.dequeue(1000, 2000) // Try to dequeue up to 10 items at a time
          if (items.length > 0) {
            receivedItems.push(...items)
          } else {
            // If the queue is empty, wait a moment before trying again
            await new Promise((res) => setTimeout(res, 1000))
          }
        }
      } catch (e) {
        readerError = e
      }
    })()

    // Wait for both the writer and reader to complete
    await Promise.all([writerPromise, readerPromise])

    // Assert that no errors occurred during the process
    expect(writerError).toBeNull()
    expect(readerError).toBeNull()

    // Assert that all items were received correctly
    expect(receivedItems.length).toBe(totalItems)

    // Assert that the received items match the source items in order and content
    for (let i = 0; i < totalItems; i++) {
      expect(receivedItems[i]).toEqual(sourceItems[i])
    }
  }, 20000) // Increase timeout for this test as it involves delays
})
