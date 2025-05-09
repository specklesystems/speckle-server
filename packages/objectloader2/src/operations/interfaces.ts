import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface Downloader extends Queue<string> {
  initializePool(params: { total: number }): void
  downloadSingle(): Promise<Item>
  disposeAsync(): Promise<void>
}
