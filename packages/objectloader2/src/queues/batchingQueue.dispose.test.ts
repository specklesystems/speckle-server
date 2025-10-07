import { describe, test, expect, vi } from 'vitest'
import BatchingQueue from './batchingQueue.js'

describe('BatchingQueue disposal', () => {
  test('should drain the queue on dispose', async () => {
    const processFunction = vi.fn().mockResolvedValue(undefined)
    const queue = new BatchingQueue<{ id: string }>({
      batchSize: 5,
      maxWaitTime: 1000,
      processFunction
    })

    const items = Array.from({ length: 3 }, (_, i) => ({ id: `item-${i}` }))
    items.forEach((item) => queue.add(item.id, item))

    expect(queue.count()).toBe(3)

    await queue.disposeAsync()

    expect(processFunction).toHaveBeenCalled()
    expect(queue.count()).toBe(0)
    expect(queue.isDisposed()).toBe(true)
  })

  test('should wait for processing to finish before disposing', async () => {
    let resolveProcess: (value: void | PromiseLike<void>) => void = () => {}
    const processPromise = new Promise<void>((resolve) => {
      resolveProcess = resolve
    })

    const processFunction = vi.fn().mockImplementation(() => processPromise)

    const queue = new BatchingQueue<{ id: string }>({
      batchSize: 2,
      maxWaitTime: 100,
      processFunction
    })

    const items1 = [{ id: 'item-1' }, { id: 'item-2' }]
    items1.forEach((item) => queue.add(item.id, item))

    // First batch is processing
    expect(processFunction).toHaveBeenCalledWith(items1)

    const items2 = [{ id: 'item-3' }]
    items2.forEach((item) => queue.add(item.id, item))

    const disposePromise = queue.disposeAsync()

    // Queue should be disposed now, but processing is still ongoing
    expect(queue.isDisposed()).toBe(true)
    resolveProcess()
    await disposePromise

    expect(queue.count()).toBe(0)
    expect(queue.isDisposed()).toBe(true)
  })

  test('adding items after dispose should do nothing', async () => {
    const processFunction = vi.fn().mockResolvedValue(undefined)
    const queue = new BatchingQueue<string>({
      batchSize: 5,
      maxWaitTime: 1000,
      processFunction
    })

    await queue.disposeAsync()
    queue.add('key1', 'item1')
    expect(queue.count()).toBe(0)
    expect(processFunction).not.toHaveBeenCalled()
  })
})
