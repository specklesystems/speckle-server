export interface RingBufferQueue {
  getSharedArrayBuffer(): SharedArrayBuffer

  enqueue(items: Uint8Array[], timeoutMs: number): Promise<number>

  dequeue(maxItems: number, timeoutMs: number): Promise<Uint8Array[]>
}
