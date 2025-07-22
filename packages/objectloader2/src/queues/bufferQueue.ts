import Queue from './queue.js'

export default class BufferQueue<T> implements Queue<T> {
  #buffer: T[] = []
  add(value: T): void {
    this.#buffer.push(value)
  }
  addAll(items: T[]): void {
    this.#buffer.push(...items)
  }
  values(): T[] {
    return this.#buffer
  }
  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}
