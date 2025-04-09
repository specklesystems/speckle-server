import { Base, Item } from '../types/types.js'
import { Downloader } from './interfaces.js'

export class MemoryDownloader implements Downloader {
  #items: Record<string, Base>
  #rootId: string
  constructor(rootId: string, items: Record<string, Base>) {
    this.#rootId = rootId
    this.#items = items
  }
  initializePool(): void {}
  downloadSingle(): Promise<Item> {
    const root = this.#items[this.#rootId]
    if (root) {
      return Promise.resolve({ baseId: this.#rootId, base: root })
    }
    throw new Error('Method not implemented.')
  }
  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
  add(): void {
    throw new Error('Method not implemented.')
  }
}
