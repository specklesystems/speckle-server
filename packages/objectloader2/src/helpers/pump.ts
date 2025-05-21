import { Downloader } from '../operations/interfaces.js'
import { Item } from '../types/types.js'
import Queue from './queue.js'

export interface Pump extends Queue<Item> {
  gather(ids: string[], downloader: Downloader): AsyncGenerator<Item>
  disposeAsync(): Promise<void>
}
