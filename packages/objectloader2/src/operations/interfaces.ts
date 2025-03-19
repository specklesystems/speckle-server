import Queue from '../helpers/queue.js'
import { Item } from '../types/types.js'

export interface ICache {
  getItem(baseId: string): Promise<Item | undefined>
  getItems(
    baseIds: string[],
    found: Queue<Item>,
    notFound: Queue<string>
  ): Promise<void>

  write(obj: Item): Promise<void>
  finish(): Promise<void>
}

export interface IDownloader extends Queue<string> {
  downloadSingle(): Promise<Item>
  finish(): Promise<void>
}
