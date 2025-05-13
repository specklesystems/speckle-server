import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface Downloader extends Queue<string> {
  initializePool(params: {
    results: Queue<Item>
    total: number
    maxDownloadBatchWait?: number
  }): void
  downloadSingle(): Promise<Item>
  disposeAsync(): Promise<void>
}

export interface Database {
  getAll(keys: string[]): Promise<(Item | undefined)[]>
  getItem(params: { id: string }): Promise<Item | undefined>
  cacheSaveBatch(params: { batch: Item[] }): Promise<void>
  disposeAsync(): Promise<void>
}
