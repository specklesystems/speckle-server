import { describe, it, expect } from 'vitest'
import { RingBufferQueue } from './RingBufferQueue.js'

describe('RingBufferQueue with wrap-around behavior', () => {
  const textEncoder = new TextEncoder()

  it('should correctly enqueue and dequeue messages, triggering a wrap-around', async () => {
    // Use a small capacity to easily test wrapping.
    // Each message needs 4 bytes for length prefix.
    const capacity = 50
    const queue = RingBufferQueue.create(capacity, 'test')

    // Three messages, each 11 bytes + 4 prefix = 15 bytes. Total = 45 bytes.
    // This will fill the buffer up to index 45.
    const msg1 = textEncoder.encode('message_one')
    const msg2 = textEncoder.encode('message_two')
    const msg3 = textEncoder.encode('message_3rd')

    let enqueue1Success = await queue.enqueue(msg1, 500)
    expect(enqueue1Success).toBe(true)
    enqueue1Success = await queue.enqueue(msg2, 500)
    expect(enqueue1Success).toBe(true)
    enqueue1Success = await queue.enqueue(msg3, 500)
    expect(enqueue1Success).toBe(true)

    // Dequeue the first message (15 bytes). This frees up space at the beginning.
    // The read pointer moves to index 15. The write pointer is at 45.
    const dequeued1 = await queue.dequeue(500)
    expect(dequeued1).toEqual(msg1)

    // Enqueue a fourth message (11 bytes + 4 prefix = 15 bytes).
    // Available space is capacity - current length = 50 - (45 - 15) = 20 bytes. It fits.
    // This write operation MUST wrap around the end of the buffer.
    // It will write 5 bytes at the end (index 45 to 49) and 10 at the start (index 0 to 9).
    const msg4 = textEncoder.encode('message_4!!')
    const enqueue2Success = await queue.enqueue(msg4, 500)
    expect(enqueue2Success).toBe(true)

    // Dequeue the remaining 3 messages. They should be in the correct order.
    let finalDequeued = await queue.dequeue(500)
    expect(finalDequeued).toEqual(msg2)
    finalDequeued = await queue.dequeue(500)
    expect(finalDequeued).toEqual(msg3)
    finalDequeued = await queue.dequeue(500)
    expect(finalDequeued).toEqual(msg4)

    // The queue should now be empty.
    const emptyDequeue = await queue.dequeue(500)
    expect(emptyDequeue).toBeUndefined()
  })

  it('should handle multiple wrap-arounds correctly', async () => {
    const capacity = 30
    const queue = RingBufferQueue.create(capacity, 'test')

    // m1 and m2 are 6 bytes + 4 prefix = 10 bytes each.
    const m1 = textEncoder.encode('123456')
    const m2 = textEncoder.encode('abcdef')

    await queue.enqueue(m1, 500) // Write pointer at 10
    await queue.enqueue(m2, 500) // Write pointer at 20

    // Dequeue m1. Read pointer moves to 10.
    let dequeued = await queue.dequeue(500)
    expect(dequeued).toEqual(m1)

    // Enqueue m3 (10 bytes). Writes to indices 20-29. Write pointer becomes 0 (wraps).
    const m3 = textEncoder.encode('ghijkl')
    await queue.enqueue(m3, 500)

    // Dequeue m2. Read pointer was at 10, now moves to 20.
    dequeued = await queue.dequeue(500)
    expect(dequeued).toEqual(m2)

    // Enqueue m4 (10 bytes). Writes to indices 0-9. Write pointer becomes 10.
    const m4 = textEncoder.encode('mnopqr')
    await queue.enqueue(m4, 500)

    // Dequeue m3. Read pointer was at 20, now moves to 0 (wraps).
    dequeued = await queue.dequeue(500)
    expect(dequeued).toEqual(m3)

    // Dequeue m4. Read pointer was at 0, now moves to 10.
    dequeued = await queue.dequeue(500)
    expect(dequeued).toEqual(m4)

    // Queue should be empty.
    dequeued = await queue.dequeue(500)
    expect(dequeued).toBeUndefined()
  })
})
