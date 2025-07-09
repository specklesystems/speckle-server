import Queue from './queue.js'

export default class BufferQueue<T> implements Queue<T> {
  #buffer: T[] = []
  add(value: T): void {
    this.#buffer.push(value)
  }

  values(): T[] {
    return this.#buffer
  }
  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}
