import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface Cache {
  getItem(params: { id: string }): Promise<Item | undefined>
  processItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void>

  add(item: Item): Promise<void>
  finish(): Promise<void>
}

export interface Downloader extends Queue<string> {
  initializePool(params: { total: number }): void
  downloadSingle(): Promise<Item>
  finish(): Promise<void>
}
