import { describe, it, expect } from 'vitest'
import { RingBufferQueue } from './RingBufferQueue.js'

describe('MainRingBufferQueue with concurrent access', () => {
  it('should handle simultaneous reads and writes without data corruption', async () => {
    const queueCapacity = 1000 // 1KB capacity
    const totalItems = 2000 // Number of items to send
    const queue = RingBufferQueue.create(queueCapacity, 'concurrent-test-queue')

    // Create a set of messages with varying sizes
    const sourceItems = Array.from({ length: totalItems }, (_, i) => {
      const size = Math.floor(Math.random() * 150) + 1 // 1 to 151 bytes
      const item = new Uint8Array(size).fill(i % 256)
      item[0] = i // Ensure each item is unique
      return item
    })

    let writerError: unknown = null
    const writerPromise = (async (): Promise<void> => {
      try {
        for (let i = 0; i < sourceItems.length; i++) {
          const success = await queue.enqueue(sourceItems[i], 2000)
          if (!success) {
            throw new Error(`Writer failed to enqueue item ${i}`)
          }
          // Small random delay to make the timing less predictable
          await new Promise((res) => setTimeout(res, Math.random() * 5))
        }
      } catch (e) {
        writerError = e
      }
    })()

    const receivedItems: Uint8Array[] = []
    let readerError: unknown = null
    const readerPromise = (async (): Promise<void> => {
      try {
        while (receivedItems.length < totalItems) {
          const item = await queue.dequeue(2000) // Try to dequeue up to 10 items at a time
          if (item) {
            receivedItems.push(item)
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
  }, 10000) // Increase timeout for this test as it involves delays
})
