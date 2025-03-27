import { Item } from '../types/types.js'
import Queue from './queue.js'

export default class AsyncGeneratorQueue implements Queue<Item> {
  #buffer: Item[] = []
  #resolveQueue: ((value: Item) => void)[] = []
  #finished = false

  add(value: Item): void {
    if (this.#resolveQueue.length > 0) {
      // If there's a pending consumer, resolve immediately
      const resolve = this.#resolveQueue.shift()!
      resolve(value)
    } else {
      // Otherwise, add to the buffer
      this.#buffer.push(value)
    }
  }
  get(id: string): Item | undefined {
    const index = this.#buffer.findIndex((x) => x.baseId === id)
    if (index !== -1) {
      return this.#buffer[index]
    }
    return undefined
  }

  async *consume(): AsyncGenerator<Item> {
    while (
      !this.#finished ||
      this.#resolveQueue.length > 0 ||
      this.#buffer.length > 0
    ) {
      if (this.#buffer.length > 0) {
        yield this.#buffer.shift()! // Yield available values
      } else {
        yield await new Promise<Item>((resolve) => this.#resolveQueue.push(resolve))
      }
    }
  }
  dispose(): void {
    this.#finished = true
  }
}
