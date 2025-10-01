import { describe, test, expect, vi } from 'vitest'
import BatchingQueue from './batchingQueue.js'

describe('BatchingQueue', () => {
  test('should add items and process them in batches', async () => {
    const processSpy = vi.fn()
    const queue = new BatchingQueue({
      batchSize: 2,
      maxWaitTime: 100,
      processFunction: async (batch: string[]): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 0))
        processSpy(batch)
      }
    })

    try {
      queue.add('key1', 'item1')
      queue.add('key2', 'item2')

      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(processSpy).toHaveBeenCalledTimes(1)
      expect(processSpy).toHaveBeenCalledWith(['item1', 'item2'])
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should process items after timeout if batch size is not reached', async () => {
    const processSpy = vi.fn()
    const queue = new BatchingQueue({
      batchSize: 5,
      maxWaitTime: 100,
      processFunction: async (batch: string[]): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 0))
        processSpy(batch)
      }
    })

    try {
      queue.add('key1', 'item1')
      queue.add('key2', 'item2')

      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(processSpy).toHaveBeenCalledTimes(1)
      expect(processSpy).toHaveBeenCalledWith(['item1', 'item2'])
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should handle multiple batches correctly', async () => {
    const processSpy = vi.fn()
    const queue = new BatchingQueue({
      batchSize: 2,
      maxWaitTime: 100,
      processFunction: async (batch: string[]): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 0))
        processSpy(batch)
      }
    })

    try {
      queue.add('key1', 'item1')
      queue.add('key2', 'item2')
      queue.add('key3', 'item3')
      queue.add('key4', 'item4')

      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(processSpy).toHaveBeenCalledTimes(2)
      expect(processSpy).toHaveBeenCalledWith(['item1', 'item2'])
      expect(processSpy).toHaveBeenCalledWith(['item3', 'item4'])
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should retrieve items by key', async () => {
    const queue = new BatchingQueue<string>({
      batchSize: 3,
      maxWaitTime: 100,
      processFunction: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    })
    try {
      queue.add('key1', 'item1')
      queue.add('key2', 'item2')

      expect(queue.get('key1')).toBe('item1')
      expect(queue.get('key2')).toBe('item2')
      expect(queue.get('key3')).toBeUndefined()
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should return correct count of items', async () => {
    const queue = new BatchingQueue<string>({
      batchSize: 3,
      maxWaitTime: 100,
      processFunction: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    })
    try {
      expect(queue.count()).toBe(0)

      queue.add('key1', 'item1')
      queue.add('key2', 'item2')

      expect(queue.count()).toBe(2)
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should not process items if already processing', async () => {
    const processSpy = vi.fn()
    const queue = new BatchingQueue({
      batchSize: 2,
      maxWaitTime: 100,
      processFunction: async (batch: string[]): Promise<void> => {
        processSpy(batch)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    })

    try {
      queue.add('key1', 'item1')
      queue.add('key2', 'item2')
      queue.add('key3', 'item3')

      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(processSpy).toHaveBeenCalledTimes(1)
      expect(processSpy).toHaveBeenCalledWith(['item1', 'item2'])

      await new Promise((resolve) => setTimeout(resolve, 500))

      expect(processSpy).toHaveBeenCalledTimes(2)
      expect(processSpy).toHaveBeenCalledWith(['item3'])
    } finally {
      await queue.disposeAsync()
    }
  })

  test('should handle processFunction throwing an exception during flush and is disposed', async () => {
    const errorMessage = 'Process function failed'
    const processFunction = vi.fn().mockRejectedValue(new Error(errorMessage))

    const queue = new BatchingQueue<{ id: string }>({
      batchSize: 5,
      maxWaitTime: 1000,
      processFunction
    })

    const items = Array.from({ length: 3 }, (_, i) => ({ id: `item-${i}` }))
    items.forEach((item) => queue.add(item.id, item))

    expect(queue.count()).toBe(3)

    // flush should not throw even if processFunction rejects
    await expect(queue.flush()).resolves.not.toThrow()

    expect(processFunction).toHaveBeenCalled()
    expect(queue.count()).toBe(0)
    expect(queue.isDisposed()).toBe(false)
    expect(queue.isErrored()).toBe(true)
    // Add more items after the exception
    queue.add('key3', { id: `item-3` })
    queue.add('key4', { id: `item-4` })

    // Wait to see if second batch gets processed (it shouldn't due to errored state)
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(queue.count()).toBe(0) // Items were not added due to errored state
    await queue.disposeAsync()
  })

  test('should drain remaining items when disposed', async () => {
    const processSpy = vi.fn()
    const queue = new BatchingQueue({
      batchSize: 5, // Large batch size to prevent automatic processing
      maxWaitTime: 10000, // Long timeout to prevent timeout-based processing
      processFunction: async (batch: string[]): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        processSpy(batch)
      }
    })

    // Add items that won't trigger automatic processing (less than batch size)
    queue.add('key1', 'item1')
    queue.add('key2', 'item2')
    queue.add('key3', 'item3')

    // Verify items are in queue but haven't been processed yet
    expect(queue.count()).toBe(3)
    expect(processSpy).not.toHaveBeenCalled()

    // Dispose should drain the remaining items
    await queue.disposeAsync()

    // Verify all items were processed during disposal
    expect(processSpy).toHaveBeenCalledTimes(1)
    expect(processSpy).toHaveBeenCalledWith(['item1', 'item2', 'item3'])
    expect(queue.count()).toBe(0)
    expect(queue.isDisposed()).toBe(true)
  })

  test('should drain items even with ongoing processing during dispose', async () => {
    const processSpy = vi.fn()
    let firstBatchStarted = false
    let allowFirstBatchToComplete: (() => void) | null = null

    const queue = new BatchingQueue({
      batchSize: 2,
      maxWaitTime: 100,
      processFunction: async (batch: string[]): Promise<void> => {
        processSpy(batch)

        // Make the first batch wait for our signal
        if (!firstBatchStarted) {
          firstBatchStarted = true
          await new Promise<void>((resolve) => {
            allowFirstBatchToComplete = resolve
          })
        } else {
          // Other batches process normally
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
      }
    })

    // Add first batch that will trigger processing but will be blocked
    queue.add('key1', 'item1')
    queue.add('key2', 'item2')

    // Wait for first batch to start processing and allowFirstBatchToComplete to be assigned
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(firstBatchStarted).toBe(true)
    expect(processSpy).toHaveBeenCalledTimes(1)
    expect(allowFirstBatchToComplete).not.toBeNull()

    // Add more items while first batch is still processing
    queue.add('key3', 'item3')
    queue.add('key4', 'item4')

    // Verify the additional items are queued
    expect(queue.count()).toBe(2)

    // Start disposal (this should wait for ongoing processing and then drain)
    const disposePromise = queue.disposeAsync()

    // Allow the first batch to complete
    allowFirstBatchToComplete!()

    // Wait for disposal to complete
    await disposePromise

    // Verify all batches were processed
    expect(processSpy).toHaveBeenCalledTimes(2)
    expect(processSpy).toHaveBeenCalledWith(['item1', 'item2'])
    expect(processSpy).toHaveBeenCalledWith(['item3', 'item4'])
    expect(queue.count()).toBe(0)
    expect(queue.isDisposed()).toBe(true)
  })
})
