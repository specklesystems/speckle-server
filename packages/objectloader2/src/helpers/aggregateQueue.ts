import Queue from './queue.js'

export default class AggregateQueue<T> implements Queue<T> {
  #queue1: Queue<T>
  #queue2: Queue<T>

  constructor(queue1: Queue<T>, queue2: Queue<T>) {
    this.#queue1 = queue1
    this.#queue2 = queue2
  }

  add(value: T): void {
    this.#queue1.add(value)
    this.#queue2.add(value)
  }

  values(): T[] {
    throw new Error('Not implemented')
  }
}
