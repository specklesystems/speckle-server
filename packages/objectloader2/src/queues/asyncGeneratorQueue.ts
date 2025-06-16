import Queue from './queue.js'

export default class AsyncGeneratorQueue<T> implements Queue<T> {
  #buffer: T[] = []
  #resolveQueue: ((value: T | undefined) => void)[] = []
  #finished = false

  add(value: T): void {
    if (this.#resolveQueue.length > 0) {
      // If there's a pending consumer, resolve immediately
      const resolve = this.#resolveQueue.shift()!
      resolve(value)
    } else {
      // Otherwise, add to the buffer
      this.#buffer.push(value)
    }
  }

  async *consume(): AsyncGenerator<T> {
    while (
      !this.#finished ||
      this.#resolveQueue.length > 0 ||
      this.#buffer.length > 0
    ) {
      if (this.#buffer.length > 0) {
        yield this.#buffer.shift()! // Yield available values
      } else {
        const val = await new Promise<T | undefined>((resolve) =>
          this.#resolveQueue.push(resolve)
        )
        if (!val && this.#finished) {
          // If finished and no more consumers, exit the loop
          return
        }
        yield val! // Yield the value resolved from the queue
      }
    }
  }
  disposeAsync(): Promise<void> {
    this.#finished = true
    const resolve = this.#resolveQueue.shift()
    if (resolve) {
      resolve(undefined) // Resolve the last promise with undefined
    }
    return Promise.resolve()
  }
}
