import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface Cache {
  getItem(params: { id: string }): Promise<Item | undefined>
  add(item: Item): Promise<void>
  disposeAsync(): Promise<void>
}

export interface Downloader extends Queue<string> {
  initializePool(params: { total: number }): void
  downloadSingle(): Promise<Item>
  disposeAsync(): Promise<void>
}
