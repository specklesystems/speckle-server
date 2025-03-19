import Queue from './queue.js'

export default class ArrayQueue<T> implements Queue<T> {
  private buffer: T[] = []
  add(value: T): void {
    this.buffer.push(value)
  }

  values(): T[] {
    return this.buffer
  }
}
