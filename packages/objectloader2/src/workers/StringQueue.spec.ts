/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
import { describe, test, expect, vi } from 'vitest'
import { StringQueue } from './StringQueue.js'
import { RingBufferQueue } from './RingBufferQueue.js'

describe('StringQueue', () => {
  test('should enqueue and dequeue strings successfully', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as RingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const messagesToEnqueue = ['hello', 'world']
    mockRingBufferQueue.enqueue = vi.fn().mockResolvedValue(true)
    mockRingBufferQueue.dequeue = vi
      .fn()
      .mockResolvedValue([
        new TextEncoder().encode('hello'),
        new TextEncoder().encode('world')
      ])

    const enqueueResult = await queue.enqueue(messagesToEnqueue, 500)
    expect(enqueueResult).toBe(true)
    expect(mockRingBufferQueue.enqueue).toHaveBeenCalledWith(
      [new TextEncoder().encode('hello'), new TextEncoder().encode('world')],
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
    } as unknown as RingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    const enqueueResult = await queue.enqueue([], 500)
    expect(enqueueResult).toBe(true)
    expect(mockRingBufferQueue.enqueue).not.toHaveBeenCalled()
  })

  test('should handle empty dequeue gracefully', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as RingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    mockRingBufferQueue.dequeue.mockResolvedValue([], 500)

    const dequeuedMessages = await queue.dequeue(5, 500)
    expect(dequeuedMessages).toEqual([])
    expect(mockRingBufferQueue.dequeue).toHaveBeenCalledWith(5, 500)
  })

  test('should not enqueue strings when underlying queue is full', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as RingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    mockRingBufferQueue.enqueue.mockResolvedValue(false)

    const enqueueResult = await queue.enqueue(['overflow'], 500)
    expect(enqueueResult).toBe(false)
    expect(mockRingBufferQueue.enqueue).toHaveBeenCalledWith(
      [new TextEncoder().encode('overflow')],
      500
    )
  })

  test('should not dequeue strings when underlying queue is empty', async () => {
    const mockRingBufferQueue = {
      enqueue: vi.fn(),
      dequeue: vi.fn(),
      getSharedArrayBuffer: vi.fn()
    } as unknown as RingBufferQueue

    const queue = new StringQueue(mockRingBufferQueue)

    mockRingBufferQueue.dequeue.mockResolvedValue([])

    const dequeuedMessages = await queue.dequeue(1, 500)
    expect(dequeuedMessages).toEqual([])
    expect(mockRingBufferQueue.dequeue).toHaveBeenCalledWith(1, 500)
  })
})
