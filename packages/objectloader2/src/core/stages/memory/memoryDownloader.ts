import Queue from '../../../queues/queue.js'
import { Base, Item } from '../../../types/types.js'
import { Downloader } from '../../interfaces.js'

export class MemoryDownloader implements Downloader {
  #items: Map<string, Base>
  #rootId: string
  #results?: Queue<Item>

  constructor(rootId: string, items: Map<string, Base>) {
    this.#rootId = rootId
    this.#items = items
  }
  initialize(params: {
    results: Queue<Item>
    total: number
    maxDownloadBatchWait?: number
  }): void {
    this.#results = params.results
  }
  downloadSingle(): Promise<Item> {
    const root = this.#items.get(this.#rootId)
    if (root) {
      return Promise.resolve({ baseId: this.#rootId, base: root })
    }
    return Promise.reject(new Error('Method not implemented.'))
  }
  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
  add(id: string): void {
    const base = this.#items.get(id)
    if (base) {
      this.#results?.add({ baseId: id, base })
      return
    }
    throw new Error('Method not implemented.')
  }
}
