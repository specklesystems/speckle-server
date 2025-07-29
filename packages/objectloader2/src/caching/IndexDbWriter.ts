import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { ItemQueue } from './ItemQueue.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { CustomLogger, delay } from '../types/functions.js'

export class IndexDbWriter {
  private mainToWorkerQueue: ItemQueue
  private db: IndexedDatabase
  private logger: CustomLogger

  constructor(rawMainToWorkerRbq: RingBufferQueue, logger: CustomLogger) {
    this.db = new IndexedDatabase({})
    this.mainToWorkerQueue = new ItemQueue(rawMainToWorkerRbq)
    this.logger = logger
  }

  public async processMessages(): Promise<void> {
    while (true) {
      const receivedMessages = await this.mainToWorkerQueue.dequeue(
        10000, 50
      ) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        const start = performance.now()
        await this.db.saveBatch({ batch: receivedMessages })
        this.logger(
          `Saved ${receivedMessages.length} items in ${performance.now() - start}ms`
        )
      } else {
        await delay(200) // Wait for 200ms before checking again
      }
    }
  }
}
