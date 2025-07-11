/* eslint-disable @typescript-eslint/unbound-method */
import { describe, test, expect, vi } from 'vitest'
import { StringQueue } from './StringQueue.js'
import { MainRingBufferQueue } from './MainRingBufferQueue.js'

describe('StringQueue', () => {
  test('should enqueue and dequeue strings successfully', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn().mockResolvedValue(true),
      dequeue: vi
        .fn()
        .mockResolvedValue([
          new TextEncoder().encode('hello'),
          new TextEncoder().encode('world')
        ]),
      getSharedArrayBuffer: vi.fn()
    } as unknown as MainRingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const messagesToEnqueue = ['hello', 'world']

    const enqueueResult = await queue.enqueue(messagesToEnqueue, 500)
    expect(enqueueResult).toBe(2)
    expect(mockRingBufferQueue.enqueue).toHaveBeenCalledWith(
      new TextEncoder().encode('hello'),
      500
    )
    expect(mockRingBufferQueue.enqueue).toHaveBeenCalledWith(
      new TextEncoder().encode('world'),
      500
    )

    const dequeuedMessages = await queue.dequeue(2, 500)
    expect(dequeuedMessages).toEqual(messagesToEnqueue)
    expect(mockRingBufferQueue.dequeue).toHaveBeenCalledWith(2, 500)
  })

  test('should handle empty enqueue gracefully', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as MainRingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const enqueueResult = await queue.enqueue([], 500)
    expect(enqueueResult).toBe(0)
    expect(mockRingBufferQueue.enqueue).not.toHaveBeenCalled()
  })

  test('should handle empty dequeue gracefully', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn().mockResolvedValue([]),
      getSharedArrayBuffer: vi.fn()
    } as unknown as MainRingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const dequeuedMessages = await queue.dequeue(5, 500)
    expect(dequeuedMessages).toEqual([])
    expect(mockRingBufferQueue.dequeue).toHaveBeenCalledWith(5, 500)
  })

  test('should not enqueue strings when underlying queue is full', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn().mockResolvedValue(false),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as MainRingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const enqueueResult = await queue.enqueue(['overflow'], 500)
    expect(enqueueResult).toBe(0)
    expect(mockRingBufferQueue.enqueue).toHaveBeenCalledWith(
      new TextEncoder().encode('overflow'),
      500
    )
  })

  test('should not dequeue strings when underlying queue is empty', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn().mockResolvedValue([]),
      getSharedArrayBuffer: vi.fn()
    } as unknown as MainRingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const dequeuedMessages = await queue.dequeue(1, 500)
    expect(dequeuedMessages).toEqual([])
    expect(mockRingBufferQueue.dequeue).toHaveBeenCalledWith(1, 500)
  })
})
