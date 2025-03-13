import Queue from './queue.js'

export default class AsyncGeneratorQueue<T> implements Queue<T> {
  private buffer: T[] = []
  private resolveQueue: ((value: T) => void)[] = []

  add(value: T): void {
    if (this.resolveQueue.length > 0) {
      // If there's a pending consumer, resolve immediately
      const resolve = this.resolveQueue.shift()!
      resolve(value)
    } else {
      // Otherwise, add to the buffer
      this.buffer.push(value)
    }
  }

  async *consume(): AsyncGenerator<T> {
    while (true) {
      if (this.buffer.length > 0) {
        yield this.buffer.shift()! // Yield available values
      } else {
        yield await new Promise<T>((resolve) => this.resolveQueue.push(resolve))
      }
    }
  }
}
