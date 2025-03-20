import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface Cache {
  getItem(baseId: string): Promise<Item | undefined>
  processItems(
    baseIds: string[],
    queueToAddFoundItems: Queue<Item>,
    queueToAddNotFoundItems: Queue<string>
  ): Promise<void>

  write(obj: Item): Promise<void>
  finish(): Promise<void>
}

export interface Downloader extends Queue<string> {
  initializePool(total: number): void
  downloadSingle(): Promise<Item>
  finish(): Promise<void>
}
