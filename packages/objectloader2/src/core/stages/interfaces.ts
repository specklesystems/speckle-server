import Queue from '../../queues/queue.js'
import { Base, Item } from '../../types/types.js'

export interface Reader {
  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void
  getObject(params: { id: string }): Promise<Base>
  requestItem(id: string): void
  requestAll(keys: string[]): void
  disposeAsync(): Promise<void>
}
