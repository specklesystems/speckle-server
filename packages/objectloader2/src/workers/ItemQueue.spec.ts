import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ItemQueue } from './ItemQueue.js'
import { MainRingBufferQueue } from './MainRingBufferQueue.js'

// Mock dependencies
const mockRingBufferQueue = {
  enqueue: vi.fn(),
  dequeue: vi.fn(),
  getSharedArrayBuffer: vi.fn()
}

vi.mock('./RingBufferQueue.js', () => {
  return {
    RingBufferQueue: vi.fn(() => mockRingBufferQueue)
  }
})

describe('ItemQueue', () => {
  let itemQueue: ItemQueue

  beforeEach(() => {
    vi.clearAllMocks()
    itemQueue = new ItemQueue(mockRingBufferQueue as unknown as MainRingBufferQueue)
  })

  it('should enqueue items when the queue is empty', async () => {
    const items = [{ baseId: '1', base: { id: 'base1', speckle_type: 'Base' } }]
    mockRingBufferQueue.enqueue.mockResolvedValue(true)

    const result = await itemQueue.enqueue(items, 1000)

    expect(mockRingBufferQueue.enqueue).toHaveBeenCalled()
    expect(result).toBe(1)
  })

  it('should return false when enqueue fails', async () => {
    const items = [{ baseId: '1', base: { id: 'base1', speckle_type: 'Base' } }]
    mockRingBufferQueue.enqueue.mockResolvedValue(false)

    const result = await itemQueue.enqueue(items, 1000)

    expect(mockRingBufferQueue.enqueue).toHaveBeenCalled()
    expect(result).toBe(0)
  })

  it('should dequeue items when the queue is not empty', async () => {
    const byteArray = new TextEncoder().encode(
      JSON.stringify({ baseId: '1', base: { id: 'base1', speckle_type: 'Base' } })
    )
    mockRingBufferQueue.dequeue.mockResolvedValue([byteArray])

    const result = await itemQueue.dequeue(1, 1000)

    expect(mockRingBufferQueue.dequeue).toHaveBeenCalled()
    expect(result).toEqual([
      { baseId: '1', base: { id: 'base1', speckle_type: 'Base' } }
    ])
  })

  it('should return an empty array when dequeue fails', async () => {
    mockRingBufferQueue.dequeue.mockResolvedValue([])

    const result = await itemQueue.dequeue(10, 1000)

    expect(mockRingBufferQueue.dequeue).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should handle invalid items during dequeue', async () => {
    const invalidByteArray = new TextEncoder().encode('invalid json')
    mockRingBufferQueue.dequeue.mockResolvedValue([invalidByteArray])

    const result = await itemQueue.dequeue(10, 1000)

    expect(mockRingBufferQueue.dequeue).toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('should return the shared array buffer', () => {
    const sharedArrayBuffer = new SharedArrayBuffer(1024)
    mockRingBufferQueue.getSharedArrayBuffer.mockReturnValue(sharedArrayBuffer)

    const result = itemQueue.getSharedArrayBuffer()

    expect(mockRingBufferQueue.getSharedArrayBuffer).toHaveBeenCalled()
    expect(result).toBe(sharedArrayBuffer)
  })
})
