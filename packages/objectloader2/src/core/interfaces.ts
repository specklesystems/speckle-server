import Queue from '../queues/queue.js'
import { Item } from '../types/types.js'

export interface Downloader extends Queue<string> {
  initialize(params: {
    results: Queue<Item>
    total: number
    maxDownloadBatchWait?: number
  }): void
  downloadSingle(): Promise<Item>
  disposeAsync(): Promise<void>
}

export interface Database {
  getAll(ids: string[]): Promise<(Item | undefined)[]>
  putAll(batch: Item[]): Promise<void>
  dispose(): void
}
